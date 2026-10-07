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
import { getAssumptionsContent } from '.';
import { DataExchangeFormat } from '../../../../customTypes';

// The real module imports ESM-only unified plugins that this Jest setup does not transform; comments are unused here.
jest.mock('../../../parseTableCellContent', () => ({ __esModule: true, default: async (str: string) => str }));

describe('getAssumptionsContent - link target', () => {
  // Covers the bug where links to an assumption did not navigate in the VS Code Markdown preview, which needs an id.
  test('gives the assumption target a matching id and name', async () => {
    const markdown = await getAssumptionsContent({
      schema: 1.1,
      assumptions: [{ id: 'a', numericId: 1, content: 'The network is trusted' }],
    } as DataExchangeFormat);
    expect(markdown).toContain('| <a id="A-0001" name="A-0001"></a>A-0001 | The network is trusted |');
  });
});
