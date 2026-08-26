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
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { FC, useMemo, useRef, useState } from 'react';
import { SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH } from '../../../configs';
import { useDataflowInfoContext } from '../../../contexts/DataflowContext/context';
import { BaseImageInfo, DataflowDiagram, DataflowDiagramSchema, EditableComponentBaseProps } from '../../../customTypes';
import { DEFAULT_DATAFLOW_DIAGRAM_NAME } from '../../../utils/migrateDataExchange';
import BaseDiagramInfo, { BaseDiagramInfoHandle } from '../../generic/BaseDiagramInfo';

const nextDiagramName = (diagrams: DataflowDiagram[]): string => {
  const used = new Set(diagrams.map(d => d.name));
  let n = diagrams.length + 1;
  while (used.has(`Diagram ${n}`)) {
    n += 1;
  }
  return `Diagram ${n}`;
};

const DataflowInfo: FC<EditableComponentBaseProps> = (props) => {
  const { dataflowInfo, setDataflowInfo } = useDataflowInfoContext();
  const diagrams = useMemo(() => dataflowInfo.diagrams ?? [], [dataflowInfo.diagrams]);

  const [selectedId, setSelectedId] = useState<string | undefined>(diagrams[0]?.id);
  const [editing, setEditing] = useState(false);
  // Bump on Add so the editor remounts and a new blank diagram opens directly in edit mode.
  const [editKey, setEditKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingRename, setPendingRename] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const baseRef = useRef<BaseDiagramInfoHandle>(null);
  // Set just before triggering confirm() so the save also appends a new diagram ("Confirm and Add").
  const pendingAddRef = useRef(false);

  // Selection survives diagram list changes (delete/import); fall back to the first diagram.
  const effectiveId = diagrams.some(d => d.id === selectedId) ? selectedId : diagrams[0]?.id;
  const selectedDiagram = diagrams.find(d => d.id === effectiveId);
  const selectedIndex = diagrams.findIndex(d => d.id === effectiveId);

  const handleConfirm = (info: BaseImageInfo) => {
    const saved: DataflowDiagram = selectedDiagram
      ? { ...selectedDiagram, image: info.image, description: info.description }
      : { id: crypto.randomUUID(), name: DEFAULT_DATAFLOW_DIAGRAM_NAME, image: info.image, description: info.description };
    const base = selectedDiagram
      ? diagrams.map(d => (d.id === selectedDiagram.id ? saved : d))
      : [saved];
    if (pendingAddRef.current) {
      pendingAddRef.current = false;
      const created: DataflowDiagram = { id: crypto.randomUUID(), name: nextDiagramName(base) };
      setDataflowInfo({ diagrams: [...base, created] });
      setSelectedId(created.id);
      setEditKey(k => k + 1);
    } else {
      setDataflowInfo({ diagrams: base });
      if (!selectedDiagram) {
        setSelectedId(saved.id);
      }
    }
  };

  const handleAdd = () => {
    const created: DataflowDiagram = {
      id: crypto.randomUUID(),
      name: diagrams.length === 0 ? DEFAULT_DATAFLOW_DIAGRAM_NAME : nextDiagramName(diagrams),
    };
    setDataflowInfo({ diagrams: [...diagrams, created] });
    setSelectedId(created.id);
    setEditKey(k => k + 1);
  };

  const handleConfirmAndAdd = () => {
    pendingAddRef.current = true;
    baseRef.current?.confirm();
  };

  const handleDelete = () => {
    const idx = diagrams.findIndex(d => d.id === effectiveId);
    const remaining = diagrams.filter(d => d.id !== effectiveId);
    setDataflowInfo({ diagrams: remaining });
    setSelectedId(remaining[Math.max(0, idx - 1)]?.id);
    setPendingDelete(false);
  };

  const openRename = () => {
    setRenameValue(selectedDiagram?.name ?? '');
    setPendingRename(true);
  };

  const handleRename = () => {
    const name = renameValue.trim();
    setDataflowInfo({ diagrams: diagrams.map(d => (d.id === effectiveId ? { ...d, name } : d)) });
    setPendingRename(false);
  };

  const handleMove = (delta: number) => {
    const target = selectedIndex + delta;
    if (selectedIndex < 0 || target < 0 || target >= diagrams.length) {
      return;
    }
    const reordered = [...diagrams];
    const [moved] = reordered.splice(selectedIndex, 1);
    reordered.splice(target, 0, moved);
    setDataflowInfo({ diagrams: reordered });
  };

  const selector = (
    <SpaceBetween direction='horizontal' size='xs'>
      {diagrams.length > 0 && (
        <Select
          selectedOption={selectedDiagram ? { label: selectedDiagram.name, value: selectedDiagram.id } : null}
          onChange={({ detail }) => setSelectedId(detail.selectedOption.value)}
          options={diagrams.map(d => ({ label: d.name, value: d.id }))}
          disabled={editing}
          placeholder='Select a data flow diagram'
        />
      )}
      <Button iconName='add-plus' onClick={editing ? handleConfirmAndAdd : handleAdd}>{editing ? 'Confirm and Add' : 'Add'}</Button>
      {diagrams.length > 0 && (
        <Button iconName='edit' onClick={openRename} disabled={editing}>Rename</Button>
      )}
      {diagrams.length > 0 && (
        <Button iconName='remove' onClick={() => setPendingDelete(true)} disabled={editing}>Delete</Button>
      )}
      {diagrams.length > 1 && (
        <Button iconName='angle-up' ariaLabel='Move diagram up in the dropdown list' onClick={() => handleMove(-1)} disabled={editing || selectedIndex <= 0} />
      )}
      {diagrams.length > 1 && (
        <Button iconName='angle-down' ariaLabel='Move diagram down in the dropdown list' onClick={() => handleMove(1)} disabled={editing || selectedIndex >= diagrams.length - 1} />
      )}
    </SpaceBetween>
  );

  return (
    <>
      <BaseDiagramInfo
        {...props}
        ref={baseRef}
        key={editKey}
        headerTitle='Dataflow'
        diagramTitle='Dataflow Diagram'
        entity={{ description: selectedDiagram?.description, image: selectedDiagram?.image }}
        onConfirm={handleConfirm}
        onEditModeChange={(mode) => { setEditing(mode); props.onEditModeChange?.(mode); }}
        validateData={DataflowDiagramSchema.shape.description.safeParse}
        selector={selector}
      />
      <Modal
        visible={pendingDelete}
        header='Delete data flow diagram?'
        onDismiss={() => setPendingDelete(false)}
        footer={
          <Box float='right'>
            <SpaceBetween direction='horizontal' size='xs'>
              <Button variant='link' onClick={() => setPendingDelete(false)}>Cancel</Button>
              <Button variant='primary' onClick={handleDelete}>Delete</Button>
            </SpaceBetween>
          </Box>
        }
      >
        {selectedDiagram && `Deleting "${selectedDiagram.name}" removes its diagram image and introduction. This can't be undone.`}
      </Modal>
      <Modal
        visible={pendingRename}
        header='Rename data flow diagram'
        onDismiss={() => setPendingRename(false)}
        footer={
          <Box float='right'>
            <SpaceBetween direction='horizontal' size='xs'>
              <Button variant='link' onClick={() => setPendingRename(false)}>Cancel</Button>
              <Button variant='primary' onClick={handleRename} disabled={!DataflowDiagramSchema.shape.name.safeParse(renameValue.trim()).success}>Save</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label='Name' constraintText={`${renameValue.length}/${SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH} characters`}>
          <Input value={renameValue} onChange={({ detail }) => setRenameValue(detail.value.slice(0, SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH))} />
        </FormField>
      </Modal>
    </>
  );
};

export default DataflowInfo;