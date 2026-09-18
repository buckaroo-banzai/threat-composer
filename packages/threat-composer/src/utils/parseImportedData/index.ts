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
import { DataExchangeFormat, TemplateThreatStatement } from '../../customTypes';
import migrateDataExchange, { SUPPORTED_SCHEMA_VERSIONS } from '../migrateDataExchange';
import sanitizeHtml from '../sanitizeHtml';
import validateData from '../validateData';

/**
 * Sanitizes, migrates, and validates an imported data payload into a current-schema DataExchangeFormat.
 * Throws on an unsupported schema version or a payload that fails strict validation.
 */
const parseImportedData = (data: any): DataExchangeFormat => {
  const parsedData = sanitizeHtml(data);

  if (Array.isArray(parsedData)) {
    // This is before schema version support
    return {
      schema: -1,
      threats: parsedData as TemplateThreatStatement[],
    };
  }

  if (!parsedData.schema || !SUPPORTED_SCHEMA_VERSIONS.includes(parsedData.schema)) {
    throw new Error('Unsupported Schema version');
  }

  // Migrate legacy schema versions (e.g. 1.0 -> 1.1) before strict validation.
  const migratedData = migrateDataExchange(parsedData);

  const validatedData = validateData(migratedData);

  if (!validatedData.success) {
    throw new Error(validatedData.error.issues.map(i => `${i.path}: ${i.message}`).join('\n'));
  }

  return validatedData.data as DataExchangeFormat;
};

export default parseImportedData;
