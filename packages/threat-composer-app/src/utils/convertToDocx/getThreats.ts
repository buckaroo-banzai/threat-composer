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
import { DataExchangeFormat, TemplateThreatStatement, standardizeNumericId, threatStatus, STATUS_NOT_SET, METADATA_KEY_PREFIX_CUSTOM } from '@aws/threat-composer';
import { Paragraph, HeadingLevel, TextRun, InternalHyperlink, Table, TableOfContents } from 'docx';
import { BULLET_LIST_REF } from './config';
import getAnchorLink from './getAnchorLink';
import getBookmark from './getBookmark';
import renderComment from './renderComments';

const getThreatBlock = async (
  threat: TemplateThreatStatement,
  data: DataExchangeFormat,
  threatsOnly: boolean,
) => {
  const threatId = `T-${standardizeNumericId(threat.numericId)}`;
  const status = (threat.status && threatStatus.find(x => x.value === threat.status)?.label) || STATUS_NOT_SET;
  const priority = threat.metadata?.find(m => m.key === 'Priority')?.value as string || '';
  const STRIDE = ((threat.metadata?.find(m => m.key === 'STRIDE')?.value || []) as string[]).join(', ');
  const commentParagraphs = await renderComment(threat.metadata);
  const descriptionKey = `${METADATA_KEY_PREFIX_CUSTOM}TMT Description`;
  const descriptionEntry = threat.metadata?.find(m => m.key === descriptionKey);
  const description = descriptionEntry
    ? (Array.isArray(descriptionEntry.value) ? descriptionEntry.value.join(', ') : descriptionEntry.value)
    : '';

  const bulletField = (label: string, value: string) => new Paragraph({
    numbering: { reference: BULLET_LIST_REF, level: 0 },
    children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)],
  });

  const paragraphs: (Paragraph | Table | TableOfContents)[] = [];

  paragraphs.push(new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [
      getBookmark(threatId),
      new TextRun(' '),
      new TextRun(threat.statement || ''),
    ],
  }));

  if (description) {
    paragraphs.push(bulletField('TMT Description', description));
  }
  paragraphs.push(bulletField('Status', status));
  paragraphs.push(bulletField('Priority', priority));
  paragraphs.push(bulletField('STRIDE', STRIDE));

  if (!threatsOnly) {
    const mitigationRuns: (TextRun | InternalHyperlink)[] = [new TextRun({ text: 'Mitigations: ', bold: true })];
    let firstMitigation = true;
    (data.mitigationLinks?.filter(ml => ml.linkedId === threat.id) || []).forEach(ml => {
      const mitigation = data.mitigations?.find(m => m.id === ml.mitigationId);
      if (mitigation) {
        if (!firstMitigation) {
          mitigationRuns.push(new TextRun('; '));
        }
        firstMitigation = false;
        mitigationRuns.push(getAnchorLink(`M-${standardizeNumericId(mitigation.numericId)}`));
        mitigationRuns.push(new TextRun(`: ${mitigation.content}`));
      }
    });
    paragraphs.push(new Paragraph({ numbering: { reference: BULLET_LIST_REF, level: 0 }, children: mitigationRuns }));

    const assumptionRuns: (TextRun | InternalHyperlink)[] = [new TextRun({ text: 'Assumptions: ', bold: true })];
    let firstAssumption = true;
    (data.assumptionLinks?.filter(al => al.linkedId === threat.id) || []).forEach(al => {
      const assumption = data.assumptions?.find(a => a.id === al.assumptionId);
      if (assumption) {
        if (!firstAssumption) {
          assumptionRuns.push(new TextRun('; '));
        }
        firstAssumption = false;
        assumptionRuns.push(getAnchorLink(`A-${standardizeNumericId(assumption.numericId)}`));
        assumptionRuns.push(new TextRun(`: ${assumption.content}`));
      }
    });
    paragraphs.push(new Paragraph({ numbering: { reference: BULLET_LIST_REF, level: 0 }, children: assumptionRuns }));
  }

  paragraphs.push(new Paragraph({ numbering: { reference: BULLET_LIST_REF, level: 0 }, children: [new TextRun({ text: 'Comments:', bold: true })] }));
  paragraphs.push(...commentParagraphs);

  // 'TMT Description' is surfaced above; the remaining custom entries form the Additional metadata section.
  const customMetadata = (threat.metadata || []).filter(
    m => m.key.startsWith(METADATA_KEY_PREFIX_CUSTOM) && m.key !== descriptionKey,
  );
  if (customMetadata.length > 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: 'Additional metadata', bold: true })], spacing: { before: 120 } }));
    customMetadata.forEach((m, index) => {
      const name = m.key.slice(METADATA_KEY_PREFIX_CUSTOM.length);
      const value = Array.isArray(m.value) ? m.value.join(', ') : m.value;
      paragraphs.push(new Paragraph({
        numbering: { reference: BULLET_LIST_REF, level: 0 },
        children: [new TextRun({ text: `${name}: `, bold: true }), new TextRun(value)],
        // One line of space after the last entry separates this threat from the next.
        spacing: index === customMetadata.length - 1 ? { after: 240 } : undefined,
      }));
    });
  }

  return paragraphs;
};

const getThreats = async (
  data: DataExchangeFormat,
  threatsOnly = false,
) => {
  const children: any[] = [];

  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun('Threats'),
    ],
  }));

  const blocks = await Promise.all((data.threats || []).map(x => getThreatBlock(x, data, threatsOnly)));
  blocks.forEach(b => children.push(...b));

  return children;
};

export default getThreats;