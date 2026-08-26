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
import validateData from '.';
import { DataExchangeFormat } from '../../customTypes';
import migrateDataExchange from '../migrateDataExchange';
import genAIChatbot from '../../data/workspaceExamples/GenAIChatbot.tc.json';
import threatComposer from '../../data/workspaceExamples/ThreatComposer.tc.json';

// Both schema versions coexist (US-1-T1): raw 1.0 fixtures document the legacy
// on-disk shape and are imported into 1.1 via migrateDataExchange before strict
// validation. validateData itself validates against the current (1.1) schema.
describe('validateData - schema 1.0 and 1.1', () => {
  test('the built-in Threat Composer fixture is schema version 1.0 on disk', () => {
    expect(threatComposer.schema).toBe(1);
  });

  test('accepts a minimal schema 1.0 document', () => {
    expect(validateData({ schema: 1 } as DataExchangeFormat).success).toBe(true);
  });

  test('now accepts schema version 1.1', () => {
    expect(validateData({ schema: 1.1 } as DataExchangeFormat).success).toBe(true);
  });

  test('accepts the built-in fixtures after 1.0 -> 1.1 migration', () => {
    expect(validateData(migrateDataExchange(threatComposer as unknown as DataExchangeFormat)).success).toBe(true);
    expect(validateData(migrateDataExchange(genAIChatbot as unknown as DataExchangeFormat)).success).toBe(true);
  });

  describe('dataflow shape', () => {
    const rawDataflow = (threatComposer as unknown as Record<string, any>).dataflow;

    test('the raw 1.0 fixture has a single base64 image and no diagrams', () => {
      expect(typeof rawDataflow?.image).toBe('string');
      expect(rawDataflow?.image?.startsWith('data:image')).toBe(true);
      expect(typeof rawDataflow?.description).toBe('string');
      expect(rawDataflow?.diagrams).toBeUndefined();
    });

    test('migrates the 1.0 image into a one-item 1.1 diagrams array', () => {
      const migrated = migrateDataExchange(threatComposer as unknown as DataExchangeFormat);
      expect(migrated.dataflow?.diagrams).toHaveLength(1);
      expect(migrated.dataflow?.diagrams?.[0].image?.startsWith('data:image')).toBe(true);
      expect((migrated.dataflow as Record<string, unknown>).image).toBeUndefined();
    });
  });
});
