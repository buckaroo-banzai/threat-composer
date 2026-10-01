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
import { DataExchangeFormat } from '../../customTypes';
import { EntityUpdate } from '../entityUpdates';

// Threat typing not yet saved to app state, keyed by editor, so a host reading the workspace (e.g. the IDE) still sees it.
const unsavedEdits = new Map<string, { threatId: string; update: EntityUpdate }>();

export const registerUnsavedEdit = (editorKey: string, threatId: string, update: EntityUpdate) => {
  unsavedEdits.set(editorKey, { threatId, update });
};

export const clearUnsavedEdit = (editorKey: string) => {
  unsavedEdits.delete(editorKey);
};

export const clearAllUnsavedEdits = () => {
  unsavedEdits.clear();
};

export const applyUnsavedEdits = (data: DataExchangeFormat): DataExchangeFormat => {
  if (unsavedEdits.size === 0) {
    return data;
  }
  return {
    ...data,
    threats: data.threats?.map((threat) => [...unsavedEdits.values()]
      .filter((edit) => edit.threatId === threat.id)
      .reduce((updated, edit) => edit.update(updated), threat)),
  };
};
