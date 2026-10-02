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
import { buildTmtMitigations } from '.';
import { MitigationLinkSchema, MitigationSchema } from '../../../customTypes';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

describe('buildTmtMitigations', () => {
  test('creates one identified mitigation per distinct text, numbered in order of first appearance', () => {
    const { mitigations, mitigationLinks } = buildTmtMitigations([
      { threatId: T1, contents: ['A', 'B'] },
      { threatId: T2, contents: ['B', 'C'] },
    ]);
    expect(mitigations.map((m) => [m.numericId, m.content, m.status])).toEqual([
      [1, 'A', 'mitigationIdentified'],
      [2, 'B', 'mitigationIdentified'],
      [3, 'C', 'mitigationIdentified'],
    ]);
    expect(new Set(mitigations.map((m) => m.id)).size).toBe(3);
    const idOf = (content: string) => mitigations.find((m) => m.content === content)!.id;
    expect(mitigationLinks).toEqual([
      { mitigationId: idOf('A'), linkedId: T1 },
      { mitigationId: idOf('B'), linkedId: T1 },
      { mitigationId: idOf('B'), linkedId: T2 },
      { mitigationId: idOf('C'), linkedId: T2 },
    ]);
  });

  test('links a text repeated within one threat only once', () => {
    const { mitigations, mitigationLinks } = buildTmtMitigations([{ threatId: T1, contents: ['A', 'A'] }]);
    expect(mitigations).toHaveLength(1);
    expect(mitigationLinks).toHaveLength(1);
  });

  // Covers the bug where texts that display identically once sanitized became separate mitigations.
  test('treats texts that differ only in HTML markup or whitespace as one mitigation', () => {
    const { mitigations, mitigationLinks } = buildTmtMitigations([
      { threatId: T1, contents: ['<b>Use TLS</b>'] },
      { threatId: T2, contents: [' Use   TLS '] },
    ]);
    expect(mitigations.map((m) => m.content)).toEqual(['<b>Use TLS</b>']);
    expect(mitigationLinks.map((l) => l.linkedId)).toEqual([T1, T2]);
  });

  test('handles texts that are names of built-in object properties', () => {
    const { mitigations } = buildTmtMitigations([{ threatId: T1, contents: ['__proto__', 'constructor', 'toString'] }]);
    expect(mitigations.map((m) => m.content)).toEqual(['__proto__', 'constructor', 'toString']);
  });

  test('returns empty lists when there are no mitigations', () => {
    expect(buildTmtMitigations([])).toEqual({ mitigations: [], mitigationLinks: [] });
  });

  test('produces records that satisfy the Threat Composer schemas', () => {
    const { mitigations, mitigationLinks } = buildTmtMitigations([{ threatId: T1, contents: ['A'] }]);
    expect(() => mitigations.forEach((m) => MitigationSchema.parse(m))).not.toThrow();
    expect(() => mitigationLinks.forEach((l) => MitigationLinkSchema.parse(l))).not.toThrow();
  });
});
