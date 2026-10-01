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
import { formatTmtModelData } from '.';
import { TmtModel } from '../tmtModel';

const makeModel = (over: Partial<TmtModel>): TmtModel => ({
  version: '4.3',
  metadata: {},
  surfaces: [],
  elementNames: {},
  threats: [],
  notes: [],
  knowledgeBase: { threatTypes: {}, propertyLabels: {} },
  ...over,
});

describe('formatTmtModelData', () => {
  test('returns an empty string when there is no model metadata or notes', () => {
    expect(formatTmtModelData(makeModel({}))).toBe('');
    expect(formatTmtModelData(makeModel({ metadata: { owner: '   ' } }))).toBe('');
  });

  test('renders every populated field and note under the model-information heading', () => {
    const md = formatTmtModelData(
      makeModel({
        metadata: {
          owner: 'Alice',
          reviewer: 'Bob',
          contributors: 'Carol',
          highLevelSystemDescription: 'A streaming system.',
          assumptions: 'Network is trusted.',
          externalDependencies: 'Auth service.',
        },
        notes: [{ id: 1, message: 'First note', addedBy: 'Alice', date: '2024-01-02' }],
      }),
    );
    expect(md).toContain('## Microsoft TMT Model Information');
    expect(md).toContain('- **Owner:** Alice');
    expect(md).toContain('- **Reviewer:** Bob');
    expect(md).toContain('- **Contributors:** Carol');
    expect(md).toContain('### High-level system description');
    expect(md).toContain('A streaming system.');
    expect(md).toContain('### Assumptions');
    expect(md).toContain('Network is trusted.');
    expect(md).toContain('### External dependencies');
    expect(md).toContain('Auth service.');
    expect(md).toContain('### Notes');
    expect(md).toContain('**Note 1** _(added by Alice, 2024-01-02)_');
    expect(md).toContain('First note');
  });

  test('omits sections for empty fields', () => {
    const md = formatTmtModelData(makeModel({ metadata: { owner: 'Alice' } }));
    expect(md).toContain('- **Owner:** Alice');
    expect(md).not.toContain('### High-level system description');
    expect(md).not.toContain('### Assumptions');
    expect(md).not.toContain('### Notes');
  });

  test('escapes Markdown metacharacters in interpolated values', () => {
    const md = formatTmtModelData(makeModel({ metadata: { owner: 'A*B_C#D[E]' } }));
    expect(md).toContain('A\\*B\\_C\\#D\\[E\\]');
  });

  test('renders a note without an author or date, and omits the attribution', () => {
    const md = formatTmtModelData(makeModel({ notes: [{ id: 3, message: 'Bare note' }] }));
    expect(md).toContain('**Note 3**');
    expect(md).toContain('Bare note');
    expect(md).not.toContain('added by');
  });

  test('preserves newlines in a multi-line note as Markdown hard breaks', () => {
    const md = formatTmtModelData(makeModel({ notes: [{ id: 1, message: 'Line one\nLine two' }] }));
    expect(md).toContain('Line one  \nLine two');
  });

  test('preserves newlines in a multi-line free-text field as Markdown hard breaks', () => {
    const md = formatTmtModelData(makeModel({ metadata: { assumptions: 'First\nSecond' } }));
    expect(md).toContain('First  \nSecond');
  });

  test('collapses a stray newline in an inline attribute to a space', () => {
    const md = formatTmtModelData(makeModel({ metadata: { owner: 'Alice\nSmith' } }));
    expect(md).toContain('- **Owner:** Alice Smith');
  });

  test('preserves a pipe character literally (Notes are a list, not a table)', () => {
    const md = formatTmtModelData(makeModel({ metadata: { assumptions: 'A | B' } }));
    expect(md).toContain('A | B');
  });
});
