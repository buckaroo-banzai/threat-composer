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
import { DataExchangeFormat, LinkedReportItem, TemplateThreatStatement, getThreatReportFields, standardizeNumericId } from '@aws/threat-composer';
import { Paragraph, HeadingLevel, TextRun, InternalHyperlink, Table, TableOfContents } from 'docx';
import { BULLET_LIST_REF } from './config';
import getAnchorLink from './getAnchorLink';
import getBookmark from './getBookmark';
import renderComment from './renderComments';

const linkedItemRuns = (label: string, items: LinkedReportItem[]) => {
  const runs: (TextRun | InternalHyperlink)[] = [new TextRun({ text: `${label}: `, bold: true })];
  items.forEach((item, index) => {
    if (index > 0) {
      runs.push(new TextRun('; '));
    }
    runs.push(getAnchorLink(item.id));
    runs.push(new TextRun(`: ${item.content}`));
  });
  return runs;
};

const getThreatBlock = async (
  threat: TemplateThreatStatement,
  data: DataExchangeFormat,
  threatsOnly: boolean,
) => {
  const threatId = `T-${standardizeNumericId(threat.numericId)}`;
  const fields = getThreatReportFields(threat, data);
  const commentParagraphs = await renderComment(threat.metadata);

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

  if (fields.tmtDescription) {
    paragraphs.push(bulletField('TMT Description', fields.tmtDescription));
  }
  paragraphs.push(bulletField('Status', fields.status));
  paragraphs.push(bulletField('Priority', fields.priority));
  paragraphs.push(bulletField('STRIDE', fields.stride));

  if (!threatsOnly) {
    paragraphs.push(new Paragraph({ numbering: { reference: BULLET_LIST_REF, level: 0 }, children: linkedItemRuns('Mitigations', fields.mitigations) }));
    paragraphs.push(new Paragraph({ numbering: { reference: BULLET_LIST_REF, level: 0 }, children: linkedItemRuns('Assumptions', fields.assumptions) }));
  }

  paragraphs.push(new Paragraph({ numbering: { reference: BULLET_LIST_REF, level: 0 }, children: [new TextRun({ text: 'Comments:', bold: true })] }));
  paragraphs.push(...commentParagraphs);

  const { customMetadata } = fields;
  if (customMetadata.length > 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: 'Additional metadata', bold: true })], spacing: { before: 120 } }));
    customMetadata.forEach(({ name, value }, index) => {
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
  const children: (Paragraph | Table | TableOfContents)[] = [];

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