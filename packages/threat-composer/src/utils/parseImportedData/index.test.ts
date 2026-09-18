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
import parseImportedData from '.';

const SAMPLE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HBSdAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('parseImportedData', () => {
  describe('legacy bare-array import (pre-schema-version)', () => {
    test('strips HTML from threat fields so sanitization is not bypassed', () => {
      const result = parseImportedData([
        { numericId: 1, statement: 'Hello <b>World</b>' },
        { numericId: 2, statement: '<script>alert(1)</script>Safe' },
      ]);

      expect(result.schema).toBe(-1);
      const threats = result.threats as any[];
      expect(threats[0].statement).toBe('Hello World');
      expect(threats[1].statement).toBe('Safe');
      // No HTML tag survives anywhere in the returned payload.
      expect(JSON.stringify(result)).not.toContain('<');
    });
  });

  describe('schema-versioned import', () => {
    test('throws for an unsupported schema version', () => {
      expect(() => parseImportedData({ schema: 999 })).toThrow('Unsupported Schema version');
    });

    test('throws when no schema is present and it is not a legacy array', () => {
      expect(() => parseImportedData({ applicationInfo: {} })).toThrow('Unsupported Schema version');
    });

    test('migrates a valid schema 1.0 payload to 1.1', () => {
      const result = parseImportedData({
        schema: 1.0,
        dataflow: { image: SAMPLE_IMAGE, description: 'flow desc' },
      });

      expect(result.schema).toBe(1.1);
      expect(result.dataflow?.diagrams).toHaveLength(1);
    });
  });
});
