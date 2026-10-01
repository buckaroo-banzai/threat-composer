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
import { importTmtModel } from '.';
import { DataExchangeFormatSchema } from '../../../customTypes';

const fixture = (name: string) => readFileSync(join(__dirname, '../__fixtures__', name), 'utf-8');

const NS = 'http://schemas.datacontract.org/2004/07/ThreatModeling.Model';
const minimalTm7 = (name?: string) =>
  `<ThreatModel xmlns="${NS}"><MetaInformation>${
    name ? `<ThreatModelName>${name}</ThreatModelName>` : ''
  }</MetaInformation><Version>4.3</Version></ThreatModel>`;

describe('importTmtModel - real fixtures', () => {
  test('assembles a schema-1.1 DataExchangeFormat from the small single-DFD model', () => {
    const result = importTmtModel(
      fixture('Sample_Threat_Model.tm7'),
      fixture('Sample_Threat_Model.htm'),
      'Sample_Threat_Model.tm7',
    );
    expect(result.data.schema).toBe(1.1);
    expect(result.workspaceName).toBe('Sample_Threat_Model');
    expect(result.data.applicationInfo?.name).toBe('Sample_Threat_Model');
    expect(result.data.dataflow?.diagrams).toHaveLength(1);
    expect(result.data.dataflow?.diagrams?.[0]?.name).toBe('Diagram 1');
    expect(result.data.dataflow?.diagrams?.[0]?.image?.startsWith('data:image/png;base64,')).toBe(true);
    expect(result.data.dataflow?.diagrams?.[0]?.id).toHaveLength(36);
    expect(result.data.threats).toHaveLength(29);
    expect(result.unconvertible).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test('assembles all diagrams from the multi-DFD model in order', () => {
    const result = importTmtModel(
      fixture('Sample_Threat_Model_Multiple_DFDs.tm7'),
      fixture('Sample_Threat_Model_Multiple_DFDs.htm'),
      'multi.tm7',
    );
    expect(result.data.dataflow?.diagrams?.map((d) => d.name)).toEqual(['Diagram 1', 'Diagram 2', 'Diagram 3']);
    expect(result.data.threats?.length).toBeGreaterThan(0);
  });

  test('the assembled data passes Threat Composer schema validation', () => {
    const result = importTmtModel(
      fixture('Sample_Threat_Model.tm7'),
      fixture('Sample_Threat_Model.htm'),
      'Sample_Threat_Model.tm7',
    );
    expect(() => DataExchangeFormatSchema.parse(result.data)).not.toThrow();
  });
});

describe('importTmtModel - workspace name', () => {
  test('uses the model name when present', () => {
    const result = importTmtModel(minimalTm7('My Model'), '<html></html>', 'ignored.tm7');
    expect(result.workspaceName).toBe('My Model');
    expect(result.data.dataflow?.diagrams).toEqual([]);
    expect(result.data.threats).toEqual([]);
  });

  test('falls back to the file name (without extension) when the model has no name', () => {
    const result = importTmtModel(minimalTm7(), '<html></html>', 'My File.tm7');
    expect(result.workspaceName).toBe('My File');
  });
});

describe('importTmtModel - error fixtures', () => {
  test('reports fallback warnings and the unconvertible threat from the (TMT-openable) "with errors" model', () => {
    const result = importTmtModel(
      fixture('Sample_Threat_Model_With_Errors.tm7'),
      fixture('Sample_Threat_Model_With_Errors.htm'),
      'Sample_Threat_Model_With_Errors.tm7',
    );
    expect(result.data.threats).toHaveLength(28);
    expect(result.data.dataflow?.diagrams?.map((d) => d.name)).toEqual(['Diagram 1']);
    expect(result.warnings).toEqual([
      'TMT threat 7: no curated template mapping matched its title and description, so its statement is the TMT description as written',
      'TMT threat 14: no curated template mapping matched its title and description, so its statement is the TMT description as written',
    ]);
    expect(result.unconvertible).toEqual([
      { id: 35, reason: expect.stringContaining('"custom:TMT ZZ_Error_Fixture_Property_Name_Over_The_Limit" is 56 characters') },
    ]);
    // The convertible threats still assemble into a schema-valid document.
    expect(() => DataExchangeFormatSchema.parse(result.data)).not.toThrow();
  });

  test('reports the non-blocking warnings from the malformed model', () => {
    const result = importTmtModel(
      fixture('Sample_Threat_Model_Malformed.tm7'),
      fixture('Sample_Threat_Model.htm'),
      'Sample_Threat_Model_Malformed.tm7',
    );
    expect(result.unconvertible).toEqual([]);
    expect(result.data.threats).toHaveLength(29);
    expect(result.warnings).toHaveLength(8);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Unknown TMT state 'Bogus' for threat 7"),
        expect.stringContaining("category 'Custom'"),
      ]),
    );
  });
});
