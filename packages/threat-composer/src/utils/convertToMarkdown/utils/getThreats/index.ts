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
import { METADATA_KEY_PREFIX_CUSTOM } from '../../../../configs';
import { STATUS_NOT_SET } from '../../../../configs/status';
import { DataExchangeFormat } from '../../../../customTypes';
import threatStatus from '../../../../data/status/threatStatus.json';
import escapeMarkdown from '../../../../utils/escapeMarkdown';
import parseTableCellContent from '../../../../utils/parseTableCellContent';
import standardizeNumericId from '../../../../utils/standardizeNumericId';

// Line breaks become <br/> so untrusted text stays on its bullet line and cannot start new Markdown blocks.
const escapeInlineMarkdown = (text: string) => escapeMarkdown(text).replace(/\r\n|\r|\n/g, '<br/>');

export const getThreatsContent = async (
  data: DataExchangeFormat,
  threatsOnly = false,
) => {
  const rows: string[] = [];
  rows.push('## Threats');

  rows.push('\n');

  if (data.threats) {
    const blocks = await Promise.all(data.threats.map(async (x) => {
      const mitigationLinks = data.mitigationLinks?.filter(ml => ml.linkedId === x.id) || [];
      const assumptionLinks = data.assumptionLinks?.filter(al => al.linkedId === x.id) || [];
      const threatId = `T-${standardizeNumericId(x.numericId)}`;
      const assumptionsContent = assumptionLinks.map(al => {
        const assumption = data.assumptions?.find(a => a.id === al.assumptionId);
        if (assumption) {
          const assumptionId = `A-${standardizeNumericId(assumption.numericId)}`;
          return `[**${assumptionId}**](#${assumptionId}): ${escapeMarkdown(assumption.content)}`;
        }
        return null;
      }).filter(al => !!al).join('<br/>');
      const mitigationsContent = mitigationLinks.map(ml => {
        const mitigation = data.mitigations?.find(m => m.id === ml.mitigationId);
        if (mitigation) {
          const mitigationId = `M-${standardizeNumericId(mitigation.numericId)}`;
          return `[**${mitigationId}**](#${mitigationId}): ${escapeMarkdown(mitigation.content)}`;
        }
        return null;
      }).filter(ml => !!ml).join('<br/>');
      const status = (x.status && threatStatus.find(ts => ts.value === x.status)?.label) || STATUS_NOT_SET;
      const priority = x.metadata?.find(m => m.key === 'Priority')?.value || '';
      const STRIDE = ((x.metadata?.find(m => m.key === 'STRIDE')?.value || []) as string[]).join(', ');
      const comments = await parseTableCellContent((x.metadata?.find(m => m.key === 'Comments')?.value as string) || '');

      const descriptionKey = `${METADATA_KEY_PREFIX_CUSTOM}TMT Description`;
      const descriptionEntry = x.metadata?.find(m => m.key === descriptionKey);
      const description = descriptionEntry
        ? (Array.isArray(descriptionEntry.value) ? descriptionEntry.value.join(', ') : descriptionEntry.value)
        : '';

      const block: string[] = [];
      block.push(`### <a name="${threatId}"></a>**${threatId}** ${escapeInlineMarkdown(x.statement || '')}`);
      block.push('');
      if (description) {
        block.push(`- **TMT Description:** ${escapeInlineMarkdown(description)}`);
      }
      block.push(`- **Status:** ${status}`);
      block.push(`- **Priority:** ${priority}`);
      block.push(`- **STRIDE:** ${STRIDE}`);
      if (!threatsOnly) {
        block.push(`- **Mitigations:** ${mitigationsContent}`);
        block.push(`- **Assumptions:** ${assumptionsContent}`);
      }
      block.push(`- **Comments:** ${comments}`);

      // 'TMT Description' is surfaced above; the remaining custom entries go in a collapsed section.
      const customMetadata = (x.metadata || []).filter(
        m => m.key.startsWith(METADATA_KEY_PREFIX_CUSTOM) && m.key !== descriptionKey,
      );
      if (customMetadata.length > 0) {
        block.push('');
        block.push('<details>');
        block.push('<summary>Additional metadata</summary>');
        block.push('');
        customMetadata.forEach(m => {
          const name = m.key.slice(METADATA_KEY_PREFIX_CUSTOM.length);
          const value = Array.isArray(m.value) ? m.value.join(', ') : m.value;
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
