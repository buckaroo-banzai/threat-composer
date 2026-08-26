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
import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { STORAGE_LOCAL_STORAGE } from '../../configs';
import { getLocalStorageKey } from '../../contexts/DataflowContext/components/LocalStorageContextProvider';
import { useMigrationConsentContext } from '../../contexts/MigrationConsentContext';
import { DataflowInfo } from '../../customTypes';
import useWorkspaceStorage from '../../hooks/useWorkspaceStorage';
import { dataflowInfoNeedsMigration, migrateDataflowInfo, LegacyDataflowInfo, CURRENT_SCHEMA_VERSION, LEGACY_DATAFLOW_SCHEMA_VERSION } from '../../utils/migrateDataExchange';

export interface DataflowMigrationGateProps {
  workspaceId: string | null;
  workspaceName?: string;
  onCancel?: () => void;
}

// Blocks mounting a legacy schema-1.0 localStorage workspace until the user consents to the 1.1 upgrade.
// Non-localStorage sources (examples, IDE) never carry unmigrated persisted data here, so they pass through.
const DataflowMigrationGate: FC<PropsWithChildren<DataflowMigrationGateProps>> = ({
  workspaceId,
  workspaceName,
  onCancel,
  children,
}) => {
  const { storageType } = useWorkspaceStorage(workspaceId);
  const { requestConsent } = useMigrationConsentContext();
  const [dataflowInfo, setDataflowInfo] = useLocalStorageState<DataflowInfo | LegacyDataflowInfo>(
    getLocalStorageKey(workspaceId),
  );
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  const needsMigration = storageType === STORAGE_LOCAL_STORAGE && dataflowInfoNeedsMigration(dataflowInfo);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    if (!needsMigration) {
      setReady(true);
      return;
    }

    startedRef.current = true;

    void (async () => {
      const proceed = await requestConsent({
        workspaceId,
        workspaceName,
        fromSchemaVersion: LEGACY_DATAFLOW_SCHEMA_VERSION,
        toSchemaVersion: CURRENT_SCHEMA_VERSION,
      });
      if (proceed && dataflowInfo) {
        setDataflowInfo(migrateDataflowInfo(dataflowInfo));
        setReady(true);
      } else {
        onCancel?.();
      }
    })();
  }, [needsMigration, workspaceId, workspaceName, requestConsent, setDataflowInfo, dataflowInfo, onCancel]);

  return ready ? <>{children}</> : null;
};

export default DataflowMigrationGate;
