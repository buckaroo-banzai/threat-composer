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
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { EntityBase, MetadataCommentSchema } from '../../../customTypes';
import useSaveOnPageHide from '../../../hooks/useSaveOnPageHide';
import { EntityUpdate, setMetadataValue } from '../../../utils/entityUpdates';
import { clearUnsavedEdit, registerUnsavedEdit } from '../../../utils/unsavedEdits';
import MarkdownEditor from '../MarkdownEditor';

export interface CommentsEditProps<T> {
  entity: T;
  onEditEntity: (entity: T, key: string, value: string | string[] | undefined) => void;
  // When given, typing is held and saved on focus loss or page hide, applied to the latest stored entity.
  onUpdateEntity?: (id: string, update: EntityUpdate) => void;
  // Set only where saves go straight to the threat list, so a host sees typing before it is saved.
  shareUnsavedEdits?: boolean;
}

const getComments = (entity: EntityBase) => (entity.metadata?.find(m => m.key === 'Comments')?.value as string) || '';

const CommentsEdit = <T extends EntityBase>({
  entity,
  onEditEntity,
  onUpdateEntity,
  shareUnsavedEdits = false,
}: CommentsEditProps<T>) => {
  const comments = useMemo(() => getComments(entity), [entity.metadata]);

  // Typed text held until focus loss or page hide (undefined = nothing unsaved).
  const unsavedValueRef = useRef<string | undefined>(undefined);
  const latestRef = useRef({ entity, onUpdateEntity });
  latestRef.current = { entity, onUpdateEntity };
  const unsavedEditKey = `${entity.id}:comments`;
  // The stored comment this editor last loaded or saved; any other value was changed from outside.
  const knownCommentsRef = useRef(comments);

  useEffect(() => {
    if (comments === knownCommentsRef.current) {
      return;
    }
    knownCommentsRef.current = comments;
    unsavedValueRef.current = undefined;
    clearUnsavedEdit(unsavedEditKey);
  }, [comments, unsavedEditKey]);

  useEffect(() => () => clearUnsavedEdit(unsavedEditKey), [unsavedEditKey]);

  // Stop sharing once the saved entity has come back through props, so the host never sees the edit disappear.
  useEffect(() => {
    if (unsavedValueRef.current === undefined) {
      clearUnsavedEdit(unsavedEditKey);
    }
  }, [entity, unsavedEditKey]);

  const save = useCallback(() => {
    const value = unsavedValueRef.current;
    if (value === undefined) {
      return;
    }
    unsavedValueRef.current = undefined;
    const latest = latestRef.current;
    if (value === getComments(latest.entity)) {
      clearUnsavedEdit(unsavedEditKey);
      return;
    }
    knownCommentsRef.current = value;
    latest.onUpdateEntity?.(latest.entity.id, setMetadataValue('Comments', value));
  }, [unsavedEditKey]);

  useSaveOnPageHide(save);

  return (<MarkdownEditor
    label='Comments'
    value={comments}
    onChange={(value) => {
      if (!onUpdateEntity) {
        onEditEntity(entity, 'Comments', value);
        return;
      }
      unsavedValueRef.current = value;
      if (shareUnsavedEdits) {
        registerUnsavedEdit(unsavedEditKey, entity.id, setMetadataValue('Comments', value));
      }
    }}
    onBlur={onUpdateEntity ? save : undefined}
    allowedHeadingLevels={[4, 5]}
    validateData={MetadataCommentSchema.safeParse}
  />);
};

export default CommentsEdit;