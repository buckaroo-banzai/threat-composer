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
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Modal from '@cloudscape-design/components/modal';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TextContent from '@cloudscape-design/components/text-content';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import ImportErrors from './components/ImportErrors';
import { DataExchangeFormat } from '../../../customTypes';
import useImportExport from '../../../hooks/useExportImport';
import { importTmtModel, TmtImportResult } from '../../../utils/tmt/importTmtModel';
import FileUpload from '../../generic/FileUpload';

type ImportMode = 'json' | 'tmt';

// Fail-fast size guard (SDL SystemsADM.10027): reject a .tm7/report before reading it into memory.
// Real fixtures are <2MB; 20MB is a generous ceiling below the downstream ~50M-char caps, tuned in US-4-T1.
const MAX_TMT_FILE_BYTES = 20 * 1024 * 1024;

export interface FileImportProps {
  composerMode: string;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  onImport: (data: DataExchangeFormat) => void;
  onExport: () => void;
  onPreview?: (data: DataExchangeFormat) => void;
  onPreviewClose?: () => void;
}

const FileImport: FC<FileImportProps> = ({
  composerMode,
  visible,
  setVisible,
  onImport,
  onExport,
  onPreview,
  onPreviewClose,
}) => {
  const [importMode, setImportMode] = useState<ImportMode>('json');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tm7Files, setTm7Files] = useState<File[]>([]);
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [data, setData] = useState<DataExchangeFormat>();
  const [tmtResult, setTmtResult] = useState<TmtImportResult>();
  const [errorsVisible, setErrorsVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'import' | 'preview' | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const { parseImportedData } = useImportExport();

  const handleImport = useCallback((files: File[]) => {
    setError('');
    setData(undefined);
    setLoading(true);

    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.addEventListener('load', (event) => {
        const result = event.target?.result;
        setError('');
        try {
          const importedData = parseImportedData(JSON.parse(result as string));
          setData(importedData);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      });

      reader.addEventListener('progress', (event) => {
        if (event.loaded && event.total) {
          const percent = (event.loaded / event.total) * 100;
          setLoadingPercentage(percent);
        }
      });

      reader.readAsText(file);
    }
  }, []);

  const finishImport = useCallback((toImport: DataExchangeFormat) => {
    onImport(toImport);
    setSelectedFiles([]);
    setTm7Files([]);
    setReportFiles([]);
    setData(undefined);
    setTmtResult(undefined);
    setErrorsVisible(false);
    setPendingAction(null);
    setVisible(false);
    onPreviewClose?.();
  }, [onImport, setVisible, onPreviewClose]);

  // Parse the selected TMT files on demand (triggered by Import or Preview, never by file selection).
  // Sets data/tmtResult and returns them; returns undefined on a blocking error.
  const parseTmtFiles = useCallback(async () => {
    if (tm7Files.length === 0 || reportFiles.length === 0) {
      return undefined;
    }
    setError('');
    const oversized = [tm7Files[0], reportFiles[0]].find((file) => file.size > MAX_TMT_FILE_BYTES);
    if (oversized) {
      setError(`"${oversized.name}" is too large (${Math.round(oversized.size / (1024 * 1024))} MB); the maximum is ${MAX_TMT_FILE_BYTES / (1024 * 1024)} MB per file.`);
      return undefined;
    }
    setLoading(true);
    try {
      const [tm7Xml, reportHtml] = await Promise.all([tm7Files[0].text(), reportFiles[0].text()]);
      const result = importTmtModel(tm7Xml, reportHtml, tm7Files[0].name);
      const validated = parseImportedData(result.data);
      setTmtResult(result);
      setData(validated);
      return { result, validated };
    } catch (e: any) {
      setError(e?.message || String(e));
      setData(undefined);
      setTmtResult(undefined);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [tm7Files, reportFiles, parseImportedData]);

  // Import and Preview share the error gate: parse (reusing a prior parse), and if any threats are
  // unconvertible or produced warnings, open the errors overlay to let the user abort or continue.
  const runTmt = useCallback(async (action: 'import' | 'preview') => {
    const parsed = data && tmtResult ? { result: tmtResult, validated: data } : await parseTmtFiles();
    if (!parsed) {
      return;
    }
    if (parsed.result.unconvertible.length > 0 || parsed.result.warnings.length > 0) {
      setPendingAction(action);
      setErrorsVisible(true);
    } else if (action === 'import') {
      finishImport(parsed.validated);
    } else {
      onPreview?.(parsed.validated);
    }
  }, [data, tmtResult, parseTmtFiles, finishImport, onPreview]);

  const handleIgnoreAndContinue = useCallback(() => {
    setErrorsVisible(false);
    if (data) {
      pendingAction === 'preview' ? onPreview?.(data) : finishImport(data);
    }
    setPendingAction(null);
  }, [data, pendingAction, finishImport, onPreview]);

  const handleConfirmImport = useCallback(() => {
    data && finishImport(data);
  }, [data, finishImport]);

  useEffect(() => {
    selectedFiles && selectedFiles.length > 0 && handleImport(selectedFiles);
  }, [selectedFiles]);

  useEffect(() => {
    // Selecting/changing TMT files does not parse (deferred to Import); discard any prior parse result.
    setData(undefined);
    setTmtResult(undefined);
    setErrorsVisible(false);
    setPendingAction(null);
    setError('');
  }, [tm7Files, reportFiles]);

  const handleModeChange = useCallback((mode: ImportMode) => {
    setImportMode(mode);
    setSelectedFiles([]);
    setTm7Files([]);
    setReportFiles([]);
    setData(undefined);
    setTmtResult(undefined);
    setErrorsVisible(false);
    setPendingAction(null);
    setError('');
  }, []);

  const handleJsonPreview = useCallback(() => {
    data && onPreview?.(data);
  }, [data, onPreview]);

  const footer = useMemo(() => {
    return (<Box float="right">
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="link" onClick={() => {
          setVisible(false);
          onPreviewClose?.();
        }}>Cancel</Button>
        {onPreview && <Button onClick={() => importMode === 'tmt' ? runTmt('preview') : handleJsonPreview()}
          disabled={importMode === 'tmt' ? (loading || tm7Files.length === 0 || reportFiles.length === 0) : !data}>
          Preview
        </Button>}
        <Button variant="primary"
          disabled={importMode === 'tmt' ? (loading || tm7Files.length === 0 || reportFiles.length === 0) : !data}
          onClick={() => importMode === 'tmt' ? runTmt('import') : handleConfirmImport()}>Import</Button>
      </SpaceBetween>
    </Box>);
  }, [setVisible, handleConfirmImport, runTmt, importMode, tm7Files, reportFiles, loading, onPreview, onPreviewClose, handleJsonPreview, data]);

  return <>
    <Modal
      visible={visible}
      footer={footer}
      onDismiss={() => {
        setVisible(false);
        onPreviewClose?.();
      }}
    >
      <SpaceBetween direction="vertical" size="m">
        <SegmentedControl
          selectedId={importMode}
          label="Import format"
          options={[
            { id: 'json', text: 'Threat Composer JSON' },
            { id: 'tmt', text: 'Microsoft TMT' },
          ]}
          onChange={({ detail }) => handleModeChange(detail.selectedId as ImportMode)}
        />
        <Alert
          action={
            <Button
              onClick={() => onExport()}
            >
            Export data
            </Button>
          }
          statusIconAriaLabel="Warning"
          type="warning"
          key="override-warning">
          <TextContent>Importing data will override all the data in current workspace. This action cannot be undone.<br />
          You can export the data to a json file as backup or create a new <b>workspace</b>.
          </TextContent>
        </Alert>
        <Alert
          statusIconAriaLabel="Warning"
          type="warning"
          key="content-warning">
          <TextContent>Only import content from trusted sources.</TextContent>
        </Alert>
        {importMode === 'json' && <FileUpload key='fileUpload' accept='application/json' files={selectedFiles} onChange={setSelectedFiles} />}
        {importMode === 'tmt' && <SpaceBetween key='tmt-inputs' direction="vertical" size="m">
          <Alert statusIconAriaLabel="Info" type="info" key="tmt-prerequisite">
            <TextContent>
              Before importing, generate a <b>Full Report</b> for your model in the Microsoft Threat
              Modeling Tool (Reports &rarr; Create Full Report) and save it. Then select both the
              model (<code>.tm7</code>) file and that Full Report (<code>.htm</code>) file below.
            </TextContent>
          </Alert>
          <FileUpload key='tm7Upload' label='Model file (.tm7)' accept='.tm7,application/xml,text/xml' files={tm7Files} onChange={setTm7Files} />
          <FileUpload key='reportUpload' label='Full Report (.htm)' accept='.htm,.html,text/html' files={reportFiles} onChange={setReportFiles} />
        </SpaceBetween>}
        {loading && importMode === 'json' && <ProgressBar
          key='progress-bar'
          value={loadingPercentage}
          label="Loading file"
        />}
        {loading && importMode === 'tmt' && <Box key='tmt-loading'>Importing&hellip;</Box>}
        {error && <Alert key="error" statusIconAriaLabel="Error" type="error" >
          {error}
        </Alert>}
        {!onPreview && composerMode !== 'Full' && data && data.threats && data.threats.length > 0 && <Alert key="info" statusIconAriaLabel="Info" type="info" >
          {data.threats.length} threat statement loaded
        </Alert>}
      </SpaceBetween>
    </Modal>
    <ImportErrors
      visible={errorsVisible}
      unconvertible={tmtResult?.unconvertible ?? []}
      warnings={tmtResult?.warnings ?? []}
      onAbort={() => setErrorsVisible(false)}
      onIgnore={handleIgnoreAndContinue}
    />
  </>;
};

export default FileImport;