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
/** @jsxImportSource @emotion/react */
import AttributeEditor, { AttributeEditorProps } from '@cloudscape-design/components/attribute-editor';
import ExpandableSection, { ExpandableSectionProps } from '@cloudscape-design/components/expandable-section';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CustomMetadataRow,
  getCustomMetadataNameError,
  getCustomMetadataValueError,
  toCustomMetadataEntries,
  toCustomMetadataRows,
} from './customMetadataRows';
import { TemplateThreatStatement } from '../../../customTypes';
import useSaveOnPageHide from '../../../hooks/useSaveOnPageHide';
import expandablePanelHeaderStyles from '../../../styles/expandablePanelHeader';
import { EntityUpdate, getCustomMetadataEntries, setCustomMetadataEntries } from '../../../utils/entityUpdates';
import { clearUnsavedEdit, registerUnsavedEdit } from '../../../utils/unsavedEdits';

export interface CustomMetadataEditorProps {
  variant: ExpandableSectionProps['variant'];
  editingStatement: TemplateThreatStatement;
  onUpdateEntity: (id: string, update: EntityUpdate) => void;
  // Set only where saves go straight to the threat list (threat cards), so a host sees typing before it is saved.
  shareUnsavedEdits?: boolean;
}

const serializeCustomEntries = (entries: { key: string; value: string | string[] }[]) => JSON.stringify(entries);

const CustomMetadataEditor: FC<CustomMetadataEditorProps> = ({
  variant,
  editingStatement,
  onUpdateEntity,
  shareUnsavedEdits = false,
}) => {
  const [rows, setRows] = useState<CustomMetadataRow[]>(() => toCustomMetadataRows(editingStatement));
  const hasUnsavedEditsRef = useRef(false);
  const latestRef = useRef({ rows, editingStatement, onUpdateEntity });
  latestRef.current = { rows, editingStatement, onUpdateEntity };
  const unsavedEditKey = `${editingStatement.id}:custom-metadata`;
  const storedCustomEntries = serializeCustomEntries(getCustomMetadataEntries(editingStatement));
  // The stored custom entries this editor last loaded or saved; any other value was changed from outside.
  const knownStoredEntriesRef = useRef(storedCustomEntries);

  // Local rows own the in-progress edits (including blank new rows); resync only when the threat changes.
  useEffect(() => {
    setRows(toCustomMetadataRows(editingStatement));
    hasUnsavedEditsRef.current = false;
    knownStoredEntriesRef.current = serializeCustomEntries(getCustomMetadataEntries(editingStatement));
  }, [editingStatement.id]);

  // An outside change (e.g. the host reloading the file) replaces the rows and discards any local draft.
  useEffect(() => {
    if (storedCustomEntries === knownStoredEntriesRef.current) {
      return;
    }
    knownStoredEntriesRef.current = storedCustomEntries;
    hasUnsavedEditsRef.current = false;
    clearUnsavedEdit(unsavedEditKey);
    setRows(toCustomMetadataRows(latestRef.current.editingStatement));
  }, [storedCustomEntries, unsavedEditKey]);

  useEffect(() => () => clearUnsavedEdit(unsavedEditKey), [unsavedEditKey]);

  // Stop sharing once the saved threat has come back through props, so the host never sees the edit disappear.
  useEffect(() => {
    if (!hasUnsavedEditsRef.current) {
      clearUnsavedEdit(unsavedEditKey);
    }
  }, [editingStatement, unsavedEditKey]);

  // Each save rewrites the whole threat list, so save on focus loss, row removal, or page hide, not per keystroke.
  const save = useCallback((rowsToSave?: CustomMetadataRow[]) => {
    if (!hasUnsavedEditsRef.current) {
      return;
    }
    const latest = latestRef.current;
    const entries = toCustomMetadataEntries(rowsToSave ?? latest.rows);
    if (!entries) {
      return;
    }
    hasUnsavedEditsRef.current = false;
    const serialized = serializeCustomEntries(entries);
    if (serialized === serializeCustomEntries(getCustomMetadataEntries(latest.editingStatement))) {
      clearUnsavedEdit(unsavedEditKey);
      return;
    }
    knownStoredEntriesRef.current = serialized;
    latest.onUpdateEntity(latest.editingStatement.id, setCustomMetadataEntries(entries));
  }, [unsavedEditKey]);

  useSaveOnPageHide(save);

  const editRows = useCallback((nextRows: CustomMetadataRow[]) => {
    hasUnsavedEditsRef.current = true;
    setRows(nextRows);
    if (!shareUnsavedEdits) {
      return;
    }
    const entries = toCustomMetadataEntries(nextRows);
    if (entries) {
      registerUnsavedEdit(unsavedEditKey, latestRef.current.editingStatement.id, setCustomMetadataEntries(entries));
    } else {
      clearUnsavedEdit(unsavedEditKey);
    }
  }, [shareUnsavedEdits, unsavedEditKey]);

  const definition = useMemo<AttributeEditorProps.FieldDefinition<CustomMetadataRow>[]>(() => [
    {
      label: 'Name',
      control: (item, index) => (
        <Input
          value={item.name}
          placeholder="Name"
          onChange={({ detail }) => editRows(rows.map((r, i) => (i === index ? { ...r, name: detail.value } : r)))}
          onBlur={() => save()}
        />
      ),
      errorText: (_item, index) => getCustomMetadataNameError(rows, index),
    },
    {
      label: 'Value',
      control: (item, index) => (
        <Textarea
          value={item.value}
          placeholder="Value"
          onChange={({ detail }) => editRows(rows.map((r, i) => (i === index ? { ...r, value: detail.value } : r)))}
          onBlur={() => save()}
        />
      ),
      errorText: (item) => getCustomMetadataValueError(item),
    },
  ], [rows, editRows, save]);

  return (
    <ExpandableSection
      headerText={<span css={variant === 'default' ? expandablePanelHeaderStyles : undefined}>{`Additional metadata (${rows.length})`}</span>}
      headingTagOverride="h3"
      variant={variant}
    >
      <AttributeEditor
        items={rows}
        definition={definition}
        addButtonText="Add metadata"
        removeButtonText="Remove"
        empty="No additional metadata."
        onAddButtonClick={() => editRows([...rows, { name: '', value: '' }])}
        onRemoveButtonClick={({ detail }) => {
          const nextRows = rows.filter((_, i) => i !== detail.itemIndex);
          editRows(nextRows);
          save(nextRows);
        }}
      />
    </ExpandableSection>
  );
};

export default CustomMetadataEditor;
