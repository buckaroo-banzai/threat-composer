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
import { applyUnsavedEdits, clearAllUnsavedEdits, clearUnsavedEdit, registerUnsavedEdit } from '.';
import { DataExchangeFormat } from '../../customTypes';
import { EntityUpdate } from '../entityUpdates';

const data = {
  schema: 1.1,
  threats: [
    { id: 't1', numericId: 1, statement: 'one' },
    { id: 't2', numericId: 2, statement: 'two', metadata: [{ key: 'Priority', value: 'High' }] },
  ],
  mitigations: [{ id: 't1', numericId: 1, content: 'mitigation sharing a threat id' }],
} as DataExchangeFormat;

const setComments = (value: string): EntityUpdate => (entity) => ({
  ...entity,
  metadata: [...(entity.metadata || []).filter((m) => m.key !== 'Comments'), { key: 'Comments', value }],
});

afterEach(() => {
  clearAllUnsavedEdits();
});

describe('applyUnsavedEdits', () => {
  test('returns the same data when nothing is unsaved', () => {
    expect(applyUnsavedEdits(data)).toBe(data);
  });

  test('applies an edit to its entity only, without changing the input', () => {
    const before = JSON.stringify(data);
    registerUnsavedEdit('a', 't2', setComments('typed'));
    const result = applyUnsavedEdits(data);
    expect(result.threats?.[0]).toBe(data.threats?.[0]);
    expect(result.threats?.[1].metadata).toEqual([{ key: 'Priority', value: 'High' }, { key: 'Comments', value: 'typed' }]);
    expect(JSON.stringify(data)).toBe(before);
  });

  test('applies edits from several editors to the same entity', () => {
    registerUnsavedEdit('a', 't1', (entity) => ({ ...entity, metadata: [...(entity.metadata || []), { key: 'custom:A', value: 'a' }] }));
    registerUnsavedEdit('b', 't1', setComments('typed'));
    expect(applyUnsavedEdits(data).threats?.[0].metadata).toEqual([{ key: 'custom:A', value: 'a' }, { key: 'Comments', value: 'typed' }]);
  });

  test('never applies an edit to a mitigation or assumption that shares a threat id', () => {
    registerUnsavedEdit('a', 't1', setComments('typed'));
    const result = applyUnsavedEdits(data);
    expect(result.threats?.[0].metadata).toEqual([{ key: 'Comments', value: 'typed' }]);
    expect(result.mitigations).toBe(data.mitigations);
  });

  test('clears every editor\'s edit at once', () => {
    registerUnsavedEdit('a', 't1', setComments('typed'));
    registerUnsavedEdit('b', 't2', setComments('typed'));
    clearAllUnsavedEdits();
    expect(applyUnsavedEdits(data)).toBe(data);
  });

  test('replaces an editor\'s earlier edit and stops applying it once cleared', () => {
    registerUnsavedEdit('a', 't1', setComments('first'));
    registerUnsavedEdit('a', 't1', setComments('second'));
    expect(applyUnsavedEdits(data).threats?.[0].metadata).toEqual([{ key: 'Comments', value: 'second' }]);
    clearUnsavedEdit('a');
    expect(applyUnsavedEdits(data)).toBe(data);
  });

  test('ignores an edit for an entity that is not in the data', () => {
    registerUnsavedEdit('a', 'missing', setComments('typed'));
    expect(applyUnsavedEdits(data).threats).toEqual(data.threats);
  });
});
