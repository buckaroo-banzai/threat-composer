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
import {
  getCustomMetadataNameError,
  getCustomMetadataValueError,
  MAX_NAME_LENGTH,
  MAX_VALUE_LENGTH,
  toCustomMetadataEntries,
} from './customMetadataRows';

const tooLong = 'n'.repeat(MAX_NAME_LENGTH + 1);

describe('getCustomMetadataNameError', () => {
  test('accepts a blank name and a name at the length limit', () => {
    expect(getCustomMetadataNameError([{ name: '  ', value: ' ' }], 0)).toBeUndefined();
    expect(getCustomMetadataNameError([{ name: 'n'.repeat(MAX_NAME_LENGTH), value: 'v' }], 0)).toBeUndefined();
  });

  test('requires a name when the row has a value', () => {
    expect(getCustomMetadataNameError([{ name: '  ', value: 'v' }], 0)).toBe('Name is required.');
  });

  test('rejects a name over the length limit', () => {
    expect(getCustomMetadataNameError([{ name: tooLong, value: 'v' }], 0)).toBe(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  });

  test('flags only the later row of a duplicated name, ignoring surrounding spaces', () => {
    const rows = [{ name: 'Owner', value: 'a' }, { name: ' Owner ', value: 'b' }];
    expect(getCustomMetadataNameError(rows, 0)).toBeUndefined();
    expect(getCustomMetadataNameError(rows, 1)).toBe('Name must be unique.');
  });
});

describe('getCustomMetadataValueError', () => {
  test('accepts a value at the length limit and rejects one over it', () => {
    expect(getCustomMetadataValueError({ name: 'n', value: 'v'.repeat(MAX_VALUE_LENGTH) })).toBeUndefined();
    expect(getCustomMetadataValueError({ name: 'n', value: 'v'.repeat(MAX_VALUE_LENGTH + 1) }))
      .toBe(`Value must be ${MAX_VALUE_LENGTH} characters or fewer.`);
  });
});

describe('toCustomMetadataEntries', () => {
  test('saves valid rows with the custom prefix and a trimmed name, skipping empty rows', () => {
    expect(toCustomMetadataEntries([{ name: ' Owner ', value: 'Bob' }, { name: '', value: '' }]))
      .toEqual([{ key: 'custom:Owner', value: 'Bob' }]);
  });

  test.each([
    ['a value without a name', { name: '', value: 'orphan' }],
    ['an over-length name', { name: tooLong, value: 'v' }],
    ['a duplicated name', { name: 'Owner', value: 'second' }],
    ['an over-length value', { name: 'Notes', value: 'v'.repeat(MAX_VALUE_LENGTH + 1) }],
  ])('saves nothing while any row has %s', (_name, invalidRow) => {
    expect(toCustomMetadataEntries([{ name: 'Owner', value: 'first' }, invalidRow])).toBeUndefined();
  });
});
