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
import { DataExchangeFormat } from '@aws/threat-composer';

// Mock the docx leaf constructors so we can inspect the emitted structure directly, and stub the
// two async helpers so this test isolates getDataflow's own multi-diagram control flow (US-2:
// every diagram, in order, under its own name, with its description then image).
// Plain functions (not jest.fn) are used deliberately: Create React App enables Jest's
// `resetMocks`, which would otherwise strip a jest.fn's mockImplementation before each test.
jest.mock('docx', () => {
  function Paragraph(this: unknown, options: Record<string, unknown>) {
    return { __type: 'Paragraph', ...options };
  }
  function TextRun(this: unknown, text: string) {
    return { __type: 'TextRun', text };
  }
  return {
    __esModule: true,
    HeadingLevel: { HEADING_1: 'HEADING_1', HEADING_2: 'HEADING_2' },
    Paragraph,
    TextRun,
  };
});
jest.mock('./getImage', () => ({
  __esModule: true,
  default: async (url: string) => ({ __type: 'Img', url }),
}));
jest.mock('./convertMarkdown', () => ({
  __esModule: true,
  default: async (content: string) => [{ __type: 'Md', content }],
}));

import getDataflow from './getDataflow';

const asData = (dataflow?: unknown) => ({ schema: 1.1, dataflow } as unknown as DataExchangeFormat);

describe('getDataflow - Word/docx multi-diagram export (US-1-T5 / US-2)', () => {
  test('emits every diagram in order, each under its own Heading 2 name', async () => {
    const children = await getDataflow(asData({
      diagrams: [
        { id: 'a', name: 'Alpha', description: 'Alpha intro', image: 'imgA' },
        { id: 'b', name: 'Beta', image: 'imgB' },
      ],
    }));

    expect(children).toEqual([
      { __type: 'Paragraph', heading: 'HEADING_1', children: [{ __type: 'TextRun', text: 'Dataflow' }] },
      { __type: 'Paragraph', heading: 'HEADING_2', children: [{ __type: 'TextRun', text: 'Alpha' }] },
      { __type: 'Md', content: 'Alpha intro' },
      { __type: 'Img', url: 'imgA' },
      { __type: 'Paragraph', heading: 'HEADING_2', children: [{ __type: 'TextRun', text: 'Beta' }] },
      { __type: 'Img', url: 'imgB' },
    ]);
  });

  test('preserves diagram order in the emitted Heading 2 names', async () => {
    const children = await getDataflow(asData({
      diagrams: [
        { id: '1', name: 'First', image: 'i1' },
        { id: '2', name: 'Second', image: 'i2' },
        { id: '3', name: 'Third', image: 'i3' },
      ],
    }));

    const diagramNames = children
      .filter((c: any) => c.__type === 'Paragraph' && c.heading === 'HEADING_2')
      .map((c: any) => c.children[0].text);
    expect(diagramNames).toEqual(['First', 'Second', 'Third']);
  });

  test('a diagram with no description emits its heading then image, and no markdown section', async () => {
    const children = await getDataflow(asData({
      diagrams: [{ id: 'a', name: 'Alpha', image: 'imgA' }],
    }));

    expect(children).toEqual([
      { __type: 'Paragraph', heading: 'HEADING_1', children: [{ __type: 'TextRun', text: 'Dataflow' }] },
      { __type: 'Paragraph', heading: 'HEADING_2', children: [{ __type: 'TextRun', text: 'Alpha' }] },
      { __type: 'Img', url: 'imgA' },
    ]);
  });

  test('a diagram with no image emits its heading then description, and no image', async () => {
    const children = await getDataflow(asData({
      diagrams: [{ id: 'a', name: 'Alpha', description: 'Alpha intro' }],
    }));

    expect(children).toEqual([
      { __type: 'Paragraph', heading: 'HEADING_1', children: [{ __type: 'TextRun', text: 'Dataflow' }] },
      { __type: 'Paragraph', heading: 'HEADING_2', children: [{ __type: 'TextRun', text: 'Alpha' }] },
      { __type: 'Md', content: 'Alpha intro' },
    ]);
  });

  test('an empty diagrams array emits only the Dataflow heading', async () => {
    const children = await getDataflow(asData({ diagrams: [] }));

    expect(children).toEqual([
      { __type: 'Paragraph', heading: 'HEADING_1', children: [{ __type: 'TextRun', text: 'Dataflow' }] },
    ]);
  });

  test('a model with no dataflow emits only the Dataflow heading', async () => {
    const children = await getDataflow(asData(undefined));

    expect(children).toEqual([
      { __type: 'Paragraph', heading: 'HEADING_1', children: [{ __type: 'TextRun', text: 'Dataflow' }] },
    ]);
  });
});
