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
import { DataExchangeFormat } from '../../../../customTypes';
import escapeMarkdown from '../../../../utils/escapeMarkdown';
import getThreatReportFields, { LinkedReportItem } from '../../../../utils/getThreatReportFields';
import parseTableCellContent from '../../../../utils/parseTableCellContent';
import standardizeNumericId from '../../../../utils/standardizeNumericId';

// Line breaks become <br/> so untrusted text stays on its bullet line and cannot start new Markdown blocks.
const escapeInlineMarkdown = (text: string) => escapeMarkdown(text).replace(/\r\n|\r|\n/g, '<br/>');

const linkedItemsContent = (items: LinkedReportItem[]) =>
  items.map((item) => `[**${item.id}**](#${item.id}): ${escapeMarkdown(item.content)}`).join('<br/>');

export const getThreatsContent = async (
  data: DataExchangeFormat,
  threatsOnly = false,
) => {
  const rows: string[] = [];
  rows.push('## Threats');

  rows.push('\n');

  if (data.threats) {
    const blocks = await Promise.all(data.threats.map(async (x) => {
      const threatId = `T-${standardizeNumericId(x.numericId)}`;
      const fields = getThreatReportFields(x, data);
      const comments = await parseTableCellContent((x.metadata?.find(m => m.key === 'Comments')?.value as string) || '');

      const block: string[] = [];
      // GitHub does not navigate to a target inside a heading, so the target gets its own paragraph.
      block.push(`<a id="${threatId}" name="${threatId}"></a>`);
      block.push('');
      block.push(`### **${threatId}** ${escapeInlineMarkdown(x.statement || '')}`);
      block.push('');
      if (fields.tmtDescription) {
        block.push(`- **TMT Description:** ${escapeInlineMarkdown(fields.tmtDescription)}`);
      }
      block.push(`- **Status:** ${fields.status}`);
      block.push(`- **Priority:** ${fields.priority}`);
      block.push(`- **STRIDE:** ${fields.stride}`);
      if (!threatsOnly) {
        block.push(`- **Mitigations:** ${linkedItemsContent(fields.mitigations)}`);
        block.push(`- **Assumptions:** ${linkedItemsContent(fields.assumptions)}`);
      }
      block.push(`- **Comments:** ${comments}`);

      if (fields.customMetadata.length > 0) {
        block.push('');
        block.push('<details>');
        block.push('<summary>Additional metadata</summary>');
        block.push('');
        fields.customMetadata.forEach(({ name, value }) => {
          block.push(`- **${escapeInlineMarkdown(name)}:** ${escapeInlineMarkdown(value)}`);
        });
        block.push('');
        block.push('</details>');
      }

      return block.join('\n');
    }));

    rows.push(blocks.join('\n\n'));
  }

  rows.push('\n');

  return rows.join('\n');
};
