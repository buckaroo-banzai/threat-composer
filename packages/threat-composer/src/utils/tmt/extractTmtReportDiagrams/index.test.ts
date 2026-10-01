/** *******************************************************************************************************************
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ******************************************************************************************************************** */
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractTmtReportDiagrams } from '.';
import { parseTmtModel } from '../parseTmtModel';
import { TmtDrawingSurface } from '../tmtModel';

const fixture = (name: string) => readFileSync(join(__dirname, '../__fixtures__', name), 'utf-8');

// A 1x1 transparent PNG as a data URL, used as a stand-in image in synthetic reports.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const makeSurface = (over: Partial<TmtDrawingSurface>): TmtDrawingSurface => ({
  guid: 'guid-0',
  name: 'Diagram 1',
  isEmpty: false,
  ...over,
});

const diagramReport = (diagrams: { name: string; src?: string }[]) =>
  `<html><body>${diagrams
    .map((d) => `<h2> Diagram: ${d.name}</h2><img alt="${d.name} diagram screenshot" src="${d.src ?? PNG}" />`)
    .join('')}</body></html>`;

describe('extractTmtReportDiagrams - real Full Report fixtures', () => {
  test('extracts the single diagram from the small single-DFD report', () => {
    const model = parseTmtModel(fixture('Sample_Threat_Model.tm7'));
    const diagrams = extractTmtReportDiagrams(fixture('Sample_Threat_Model.htm'), model.surfaces);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].name).toBe('Diagram 1');
    expect(diagrams[0].surfaceGuid).toBe(model.surfaces.find((s) => !s.isEmpty)!.guid);
    expect(diagrams[0].image.startsWith('data:image/png;base64,')).toBe(true);
    expect(diagrams[0].image.length).toBeGreaterThan(100);
  });

  test('extracts all diagrams in model order from the multi-DFD report', () => {
    const model = parseTmtModel(fixture('Sample_Threat_Model_Multiple_DFDs.tm7'));
    const diagrams = extractTmtReportDiagrams(fixture('Sample_Threat_Model_Multiple_DFDs.htm'), model.surfaces);
    expect(diagrams.map((d) => d.name)).toEqual(['Diagram 1', 'Diagram 2', 'Diagram 3']);
    expect(diagrams.every((d) => d.image.startsWith('data:image/png;base64,'))).toBe(true);
  });

  test('extracts the custom-named diagram from the large report and ignores interaction screenshots', () => {
    const model = parseTmtModel(fixture('ContosoCast Threat Model Fully Labeled with AI.tm7'));
    const diagrams = extractTmtReportDiagrams(fixture('ContosoCast Threat Model Fully Labeled with AI.htm'), model.surfaces);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].name).toBe('ContosoCast high-level flows');
  });
});

describe('extractTmtReportDiagrams - extraction rules', () => {
  test('ignores per-threat interaction screenshots', () => {
    const html =
      '<html><body>' +
      '<h2> Diagram: Diagram 1</h2><img alt="Diagram 1 diagram screenshot" src="' + PNG + '" />' +
      '<h3> Interaction: Generic Data Flow</h3><img alt="Generic Data Flow interaction screenshot" src="' + PNG + '" />' +
      '<h3> Interaction: HTTPS</h3><img alt="HTTPS interaction screenshot" src="' + PNG + '" />' +
      '</body></html>';
    const diagrams = extractTmtReportDiagrams(html, [makeSurface({ guid: 'g1', name: 'Diagram 1' })]);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].surfaceGuid).toBe('g1');
  });

  test('matches only non-empty surfaces, which the report includes in model order', () => {
    const surfaces = [
      makeSurface({ guid: 'empty', name: 'Empty', isEmpty: true }),
      makeSurface({ guid: 'real', name: 'Diagram 1', isEmpty: false }),
    ];
    const diagrams = extractTmtReportDiagrams(diagramReport([{ name: 'Diagram 1' }]), surfaces);
    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].surfaceGuid).toBe('real');
  });

  test('returns an empty list when there are no non-empty surfaces and no diagrams', () => {
    expect(extractTmtReportDiagrams('<html><body></body></html>', [])).toEqual([]);
  });
});

describe('extractTmtReportDiagrams - failure policy (all blocking)', () => {
  test('throws on a diagram-count mismatch rather than guessing', () => {
    const surfaces = [
      makeSurface({ guid: 'a', name: 'Diagram 1' }),
      makeSurface({ guid: 'b', name: 'Diagram 2' }),
    ];
    expect(() => extractTmtReportDiagrams(diagramReport([{ name: 'Diagram 1' }]), surfaces)).toThrow(/refusing to guess/);
  });

  test('throws on a diagram-name mismatch at a position', () => {
    const surfaces = [makeSurface({ guid: 'a', name: 'Expected Name' })];
    expect(() => extractTmtReportDiagrams(diagramReport([{ name: 'Different Name' }]), surfaces)).toThrow(/is named/);
  });

  test('throws when a diagram image is not an embedded PNG data URL', () => {
    const surfaces = [makeSurface({ guid: 'a', name: 'Diagram 1' })];
    const html = diagramReport([{ name: 'Diagram 1', src: 'https://example.com/diagram.png' }]);
    expect(() => extractTmtReportDiagrams(html, surfaces)).toThrow(/embedded PNG image/);
  });

  test('throws when the base64 payload smuggles non-base64 characters via HTML entities', () => {
    const surfaces = [makeSurface({ guid: 'a', name: 'Diagram 1' })];
    // getAttribute decodes entities, so this src becomes data:image/png;base64,AAAA"><script>...
    const html =
      '<html><body><h2> Diagram: Diagram 1</h2>' +
      '<img alt="Diagram 1 diagram screenshot" src="data:image/png;base64,AAAA&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;" />' +
      '</body></html>';
    expect(() => extractTmtReportDiagrams(html, surfaces)).toThrow(/malformed or non-base64/);
  });

  test('throws on an empty base64 payload', () => {
    const surfaces = [makeSurface({ guid: 'a', name: 'Diagram 1' })];
    const html = diagramReport([{ name: 'Diagram 1', src: 'data:image/png;base64,' }]);
    expect(() => extractTmtReportDiagrams(html, surfaces)).toThrow(/malformed or non-base64/);
  });

  test('throws when a diagram image exceeds the configured byte limit', () => {
    const surfaces = [makeSurface({ guid: 'a', name: 'Diagram 1' })];
    expect(() => extractTmtReportDiagrams(diagramReport([{ name: 'Diagram 1' }]), surfaces, { maxImageBytes: 4 })).toThrow(
      /exceeding the/,
    );
  });

  test('throws when the report HTML exceeds the maximum allowed size', () => {
    const surfaces = [makeSurface({ guid: 'a', name: 'Diagram 1' })];
    expect(() => extractTmtReportDiagrams(diagramReport([{ name: 'Diagram 1' }]), surfaces, { maxChars: 10 })).toThrow(
      /maximum allowed size/,
    );
  });

  test('throws on empty report input', () => {
    expect(() => extractTmtReportDiagrams('   ', [])).toThrow(/Empty Full Report/);
  });
});
