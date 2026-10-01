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
import { setCustomMetadataEntries, setMetadataValue, updateEntityById } from '.';
import { SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH } from '../../configs';
import { TemplateThreatStatement } from '../../customTypes';

const threat: TemplateThreatStatement = {
  id: 't1',
  numericId: 1,
  metadata: [{ key: 'Priority', value: 'High' }, { key: 'Comments', value: 'old' }, { key: 'custom:Owner', value: 'Bob' }],
};

describe('setMetadataValue', () => {
  test('replaces an existing value in place', () => {
    expect(setMetadataValue('Comments', 'new')(threat).metadata).toEqual([
      { key: 'Priority', value: 'High' }, { key: 'Comments', value: 'new' }, { key: 'custom:Owner', value: 'Bob' },
    ]);
  });

  test('appends a new key and removes a key set to empty', () => {
    expect(setMetadataValue('STRIDE', ['S'])(threat).metadata?.[3]).toEqual({ key: 'STRIDE', value: ['S'] });
    expect(setMetadataValue('Comments', '')(threat).metadata?.map((m) => m.key)).toEqual(['Priority', 'custom:Owner']);
  });
});

describe('setCustomMetadataEntries', () => {
  test('replaces all custom entries and keeps the others', () => {
    expect(setCustomMetadataEntries([{ key: 'custom:Team', value: 'Red' }])(threat).metadata).toEqual([
      { key: 'Priority', value: 'High' }, { key: 'Comments', value: 'old' }, { key: 'custom:Team', value: 'Red' },
    ]);
  });

  test.each([
    ['a key over the schema length limit', [{ key: `custom:${'n'.repeat(SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH)}`, value: 'v' }]],
    ['a duplicated key', [{ key: 'custom:A', value: 'a' }, { key: 'custom:A', value: 'b' }]],
    ['a key without the custom prefix', [{ key: 'Priority', value: 'Low' }]],
  ])('leaves the entity unchanged for %s', (_name, entries) => {
    expect(setCustomMetadataEntries(entries)(threat)).toBe(threat);
  });
});

describe('updateEntityById', () => {
  test('updates only the matching entity and ignores an unknown id', () => {
    const list = [threat, { id: 't2', numericId: 2 }];
    const updated = updateEntityById(list, 't2', setMetadataValue('Comments', 'x'));
    expect(updated[0]).toBe(threat);
    expect(updated[1].metadata).toEqual([{ key: 'Comments', value: 'x' }]);
    expect(updateEntityById(list, 'missing', setMetadataValue('Comments', 'x'))).toBe(list);
  });

  test('keeps both edits when two updates to one entity are applied in the same event', () => {
    let list = [threat];
    list = updateEntityById(list, 't1', setMetadataValue('Comments', 'typed'));
    list = updateEntityById(list, 't1', setCustomMetadataEntries([{ key: 'custom:Owner', value: 'Alice' }]));
    expect(list[0].metadata).toEqual([
      { key: 'Priority', value: 'High' }, { key: 'Comments', value: 'typed' }, { key: 'custom:Owner', value: 'Alice' },
    ]);
  });
});
