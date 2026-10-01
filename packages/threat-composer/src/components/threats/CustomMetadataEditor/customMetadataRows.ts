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
import { FREE_TEXT_INPUT_MAX_LENGTH, METADATA_KEY_PREFIX_CUSTOM, SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH } from '../../../configs';
import { TemplateThreatStatement } from '../../../customTypes';

export interface CustomMetadataRow {
  name: string;
  value: string;
}

// The stored key is 'custom:<name>' (max 50 incl. prefix); users edit/see just the <name>.
export const MAX_NAME_LENGTH = SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH - METADATA_KEY_PREFIX_CUSTOM.length;

export const MAX_VALUE_LENGTH = FREE_TEXT_INPUT_MAX_LENGTH;

export const toCustomMetadataRows = (statement: TemplateThreatStatement): CustomMetadataRow[] =>
  (statement.metadata || [])
    .filter((m) => m.key.startsWith(METADATA_KEY_PREFIX_CUSTOM))
    .map((m) => ({
      name: m.key.slice(METADATA_KEY_PREFIX_CUSTOM.length),
      value: Array.isArray(m.value) ? m.value.join(', ') : m.value,
    }));

// Only a later row repeating a name is flagged, pointing the user at the row to fix.
export const getCustomMetadataNameError = (rows: CustomMetadataRow[], index: number): string | undefined => {
  const name = rows[index].name.trim();
  if (name.length === 0) {
    // A fully empty row is a harmless draft (e.g. just added); a value without a name would be lost.
    return rows[index].value.trim().length > 0 ? 'Name is required.' : undefined;
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  if (rows.some((r, i) => i < index && r.name.trim() === name)) {
    return 'Name must be unique.';
  }
  return undefined;
};

export const getCustomMetadataValueError = (row: CustomMetadataRow): string | undefined =>
  row.value.length > MAX_VALUE_LENGTH ? `Value must be ${MAX_VALUE_LENGTH} characters or fewer.` : undefined;

// Returns undefined while any row has an error, so stored data is never partly overwritten; empty rows are skipped.
export const toCustomMetadataEntries = (rows: CustomMetadataRow[]): { key: string; value: string }[] | undefined => {
  if (rows.some((r, i) => getCustomMetadataNameError(rows, i) || getCustomMetadataValueError(r))) {
    return undefined;
  }
  return rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({ key: `${METADATA_KEY_PREFIX_CUSTOM}${r.name.trim()}`, value: r.value }));
};
