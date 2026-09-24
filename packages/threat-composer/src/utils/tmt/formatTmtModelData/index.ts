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
import escapeMarkdown from '../../escapeMarkdown';
import { TmtModel, TmtNote } from '../tmtModel';

// TMT values are untrusted free text; escape them so they render literally and can't inject Markdown.
const escapeValue = (value?: string): string => escapeMarkdown((value ?? '').trim());

// TMT lets users put line breaks in free-text fields; convert them to Markdown hard breaks so multi-line
// text renders faithfully instead of collapsing onto one line or breaking out of its section.
const blockText = (value?: string): string => escapeValue(value).replace(/\r?\n/g, '  \n');

// Inline fields hold a single value; collapse any stray newline to a space so the list item stays intact.
const inlineText = (value?: string): string => escapeValue(value).replace(/\s*\r?\n\s*/g, ' ');

const formatNote = (note: TmtNote): string => {
  const addedBy = note.addedBy?.trim();
  const date = note.date?.trim();
  const attribution =
    addedBy && date
      ? ` _(added by ${inlineText(addedBy)}, ${inlineText(date)})_`
      : addedBy
        ? ` _(added by ${inlineText(addedBy)})_`
        : date
          ? ` _(${inlineText(date)})_`
          : '';
  const header = `**Note ${note.id}**${attribution}`;
  const message = blockText(note.message);
  return message ? `${header}\n\n${message}` : header;
};

/**
 * Formats the Microsoft TMT model information (MetaInformation and Notes) as a Markdown block for the
 * Threat Composer Application description. The threat-model name is not included here (it becomes the
 * workspace/application name). Empty fields are omitted; when nothing is present, returns an empty string.
 */
export const formatTmtModelData = (model: TmtModel): string => {
  const { metadata, notes } = model;
  const sections: string[] = [];

  const attributes: string[] = [];
  if (metadata.owner?.trim()) {
    attributes.push(`- **Owner:** ${inlineText(metadata.owner)}`);
  }
  if (metadata.reviewer?.trim()) {
    attributes.push(`- **Reviewer:** ${inlineText(metadata.reviewer)}`);
  }
  if (metadata.contributors?.trim()) {
    attributes.push(`- **Contributors:** ${inlineText(metadata.contributors)}`);
  }
  if (attributes.length) {
    sections.push(attributes.join('\n'));
  }

  if (metadata.highLevelSystemDescription?.trim()) {
    sections.push(`### High-level system description\n\n${blockText(metadata.highLevelSystemDescription)}`);
  }
  if (metadata.assumptions?.trim()) {
    sections.push(`### Assumptions\n\n${blockText(metadata.assumptions)}`);
  }
  if (metadata.externalDependencies?.trim()) {
    sections.push(`### External dependencies\n\n${blockText(metadata.externalDependencies)}`);
  }
  if (notes.length) {
    sections.push(`### Notes\n\n${notes.map(formatNote).join('\n\n')}`);
  }

  if (!sections.length) {
    return '';
  }
  return `## Microsoft TMT Model Information\n\n${sections.join('\n\n')}`;
};
