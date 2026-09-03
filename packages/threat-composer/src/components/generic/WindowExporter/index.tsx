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
import { useCallback, FC, PropsWithChildren, useEffect } from 'react';
import { useWorkspacesContext } from '../../../contexts';
import { useMigrationConsentContext } from '../../../contexts/MigrationConsentContext';
import { DataExchangeFormat } from '../../../customTypes';
import useExportImport, { PLACEHOLDER_EXCHANGE_DATA } from '../../../hooks/useExportImport';
import useRemoveData from '../../../hooks/useRemoveData';
import convertToMarkdown from '../../../utils/convertToMarkdown';
import { dataExchangeNeedsMigration, CURRENT_SCHEMA_VERSION } from '../../../utils/migrateDataExchange';

/**
 * Export threat-composer functionalities via window object.
 */
const WindowExporter: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { getWorkspaceData, parseImportedData, importData } = useExportImport();
  const {
    currentWorkspace,
    workspaceList,
    addWorkspace,
    switchWorkspace,
    renameWorkspace,
  } = useWorkspacesContext();
  const { deleteWorkspace } = useRemoveData();
  const { pendingMigration, setPendingMigration, requestConsent } = useMigrationConsentContext();

  const setWorkspaceData = useCallback(
    async (data: any) => {
      const incoming = data || PLACEHOLDER_EXCHANGE_DATA;
      const needsMigration = dataExchangeNeedsMigration(incoming);
      // A below-current-schema injected model is migrated in memory so the current UI can render
      // it, while its original form is retained so a host that autosaves (e.g. the IDE) cannot
      // persist an upgraded schema until the user consents.
      setPendingMigration(needsMigration ? (incoming as DataExchangeFormat) : null);
      const parsedData = parseImportedData(incoming);
      await importData(parsedData);
      // Prompt on load. Proceed enables persisting the migrated form; Cancel keeps the original
      // (getCurrentWorkspaceData keeps returning it) so the file on disk is left unchanged.
      if (needsMigration) {
        const proceed = await requestConsent({
          workspaceId: currentWorkspace?.id ?? null,
          workspaceName: currentWorkspace?.name,
          subject: 'This file',
          fromSchemaVersion: incoming.schema,
          toSchemaVersion: CURRENT_SCHEMA_VERSION,
        });
        if (proceed) {
          setPendingMigration(null);
          // Persist the upgrade to disk immediately. Deferred so the host has registered its
          // 'save' listener, which it does only after setCurrentWorkspaceData resolves.
          setTimeout(() => {
            window.threatcomposer.dispatchEvent(new CustomEvent('save', { detail: getWorkspaceData() }));
          }, 0);
        }
      }
    },
    [parseImportedData, importData, setPendingMigration, requestConsent, currentWorkspace, getWorkspaceData],
  );

  // While a migration awaits consent, round-trip the original document unchanged so a host's
  // autosave cannot persist an upgraded schema.
  const getCurrentWorkspaceData = useCallback(
    () => pendingMigration ?? getWorkspaceData(),
    [getWorkspaceData, pendingMigration],
  );

  const getCurrentWorkspaceDataMarkdown = useCallback(async () => {
    return convertToMarkdown(getWorkspaceData());
  }, [getWorkspaceData]);


  useEffect(() => {
    window.threatcomposer.getWorkspaceList = () => workspaceList;
  }, [workspaceList]);

  useEffect(() => {
    window.threatcomposer.getCurrentWorkspaceMetadata = () => currentWorkspace;
  }, [currentWorkspace]);

  useEffect(() => {
    window.threatcomposer.getCurrentWorkspaceData = getCurrentWorkspaceData;
  }, [getCurrentWorkspaceData]);

  useEffect(() => {
    window.threatcomposer.getCurrentWorkspaceDataMarkdown = getCurrentWorkspaceDataMarkdown;
  }, [getCurrentWorkspaceDataMarkdown]);

  useEffect(() => {
    window.threatcomposer.setCurrentWorkspaceData = setWorkspaceData;
  }, [setWorkspaceData]);

  useEffect(() => {
    window.threatcomposer.createWorkspace = addWorkspace;
  }, [addWorkspace]);

  useEffect(() => {
    window.threatcomposer.deleteWorkspace = deleteWorkspace;
  }, [deleteWorkspace]);

  useEffect(() => {
    window.threatcomposer.switchWorkspace = switchWorkspace;
  }, [switchWorkspace]);

  useEffect(() => {
    window.threatcomposer.renameWorkspace = renameWorkspace;
  }, [renameWorkspace]);

  return <>{children}</>;
};

export default WindowExporter;
