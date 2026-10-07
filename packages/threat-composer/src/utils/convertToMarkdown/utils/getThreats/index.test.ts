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
import { getThreatsContent } from '.';
import { DataExchangeFormat } from '../../../../customTypes';

// The real module imports ESM-only unified plugins that this Jest setup does not transform; comments are unused here.
jest.mock('../../../parseTableCellContent', () => ({ __esModule: true, default: async (str: string) => str }));

const render = (metadata: { key: string; value: string | string[] }[]) => getThreatsContent({
  schema: 1.1,
  threats: [{ id: 'id', numericId: 1, statement: 'An actor can act', metadata }],
} as DataExchangeFormat);

const toLines = (markdown: string) => markdown.split(/\r\n|\r|\n/);

const linesStartingWith = (markdown: string, prefix: string) =>
  toLines(markdown).filter((line) => line.startsWith(prefix));

describe('getThreatsContent - untrusted threat statement', () => {
  test('keeps a multi-line statement inside its heading', async () => {
    const markdown = await getThreatsContent({
      schema: 1.1,
      threats: [{ id: 'id', numericId: 1, statement: 'An actor can act\n- **Status:** Mitigated' }],
    } as DataExchangeFormat);
    expect(markdown).toContain('**T-0001** An actor can act<br/>- \\*\\*Status:\\*\\* Mitigated');
    expect(linesStartingWith(markdown, '- \\*\\*Status')).toEqual([]);
  });
});

describe('getThreatsContent - link target', () => {
  // Covers the bug where links to a threat did not navigate in the VS Code Markdown preview (no id) or on GitHub (target inside the heading).
  test('puts the threat target, with matching id and name, on its own line above the heading', async () => {
    const lines = toLines(await render([]));
    const headingIndex = lines.findIndex((line) => line.startsWith('### '));
    expect(lines.slice(headingIndex - 2, headingIndex + 1)).toEqual([
      '<a id="T-0001" name="T-0001"></a>',
      '',
      '### **T-0001** An actor can act',
    ]);
  });
});

describe('getThreatsContent - untrusted custom metadata', () => {
  test('keeps a multi-line TMT Description on its bullet line', async () => {
    const markdown = await render([{ key: 'custom:TMT Description', value: 'x\n- **Status:** Mitigated' }]);
    expect(linesStartingWith(markdown, '- \\*\\*Status')).toEqual([]);
    expect(linesStartingWith(markdown, '- **Status:**')).toHaveLength(1);
    expect(markdown).toContain('- **TMT Description:** x<br/>- \\*\\*Status:\\*\\* Mitigated');
  });

  test.each([
    ['a fake bullet', 'x\n- **Status:** Mitigated'],
    ['a thematic break', 'x\n\n---'],
    ['a table', '|a|b|\n|-|-|'],
    ['a fenced code block', '~~~\ncode\n~~~'],
    ['an indented code block', 'x\n\n    code'],
    ['CRLF line breaks', 'x\r\n# heading'],
    ['CR line breaks', 'x\r# heading'],
  ])('keeps a value containing %s inside one bullet of the additional metadata', async (_name, value) => {
    const markdown = await render([{ key: 'custom:TMT Notes', value }]);
    const region = toLines(markdown.slice(markdown.indexOf('<summary>'), markdown.indexOf('</details>'))).slice(1);
    expect(region.filter((line) => line !== '')).toHaveLength(1);
    expect(region.filter((line) => line !== '')[0]).toMatch(/^- \*\*TMT Notes:\*\* /);
  });

  test('keeps a multi-line name on its bullet line', async () => {
    const markdown = await render([{ key: 'custom:a\n- b', value: 'v' }]);
    expect(markdown).toContain('- **a<br/>- b:** v');
  });

  test('cannot close the details region or inject HTML', async () => {
    const markdown = await render([{ key: 'custom:TMT Notes', value: '</details><img src=x onerror=alert(1)>' }]);
    expect(markdown.match(/<\/details>/g)).toHaveLength(1);
    expect(markdown).not.toContain('<img');
  });

  test('cannot form a link', async () => {
    const markdown = await render([{ key: 'custom:TMT Notes', value: '[a](javascript:alert(1))' }]);
    expect(markdown).toContain('\\[a\\]\\(javascript:alert\\(1\\)\\)');
  });
});
