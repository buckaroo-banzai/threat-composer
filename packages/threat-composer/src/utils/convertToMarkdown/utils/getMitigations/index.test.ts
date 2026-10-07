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
import { getMitigationsContent } from '.';
import { DataExchangeFormat } from '../../../../customTypes';

// The real module imports ESM-only unified plugins that this Jest setup does not transform; comments are unused here.
jest.mock('../../../parseTableCellContent', () => ({ __esModule: true, default: async (str: string) => str }));

describe('getMitigationsContent - link target', () => {
  // Covers the bug where links to a mitigation did not navigate in the VS Code Markdown preview, which needs an id.
  test('gives the mitigation target a matching id and name', async () => {
    const markdown = await getMitigationsContent({
      schema: 1.1,
      mitigations: [{ id: 'm', numericId: 1, content: 'Use TLS' }],
    } as DataExchangeFormat);
    expect(markdown).toContain('| <a id="M-0001" name="M-0001"></a>M-0001 | Use TLS |');
  });
});
