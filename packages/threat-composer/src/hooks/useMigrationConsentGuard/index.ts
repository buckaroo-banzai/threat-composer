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
import { useCallback } from 'react';
import { useMigrationConsentContext } from '../../contexts/MigrationConsentContext';
import { useWorkspacesContext } from '../../contexts/WorkspacesContext';
import { CURRENT_SCHEMA_VERSION } from '../../utils/migrateDataExchange';

/**
 * Guards an action that would persist a migrated (current-schema) document. When a below-current
 * document is awaiting consent, prompts the user; on Proceed it clears the pending state so the
 * migrated form can be persisted, on Cancel it leaves the original untouched.
 * @returns a function that resolves true to proceed with the action, false if the user declined.
 */
const useMigrationConsentGuard = () => {
  const { currentWorkspace } = useWorkspacesContext();
  const { pendingMigration, setPendingMigration, requestConsent } = useMigrationConsentContext();

  return useCallback(async (): Promise<boolean> => {
    if (!pendingMigration) {
      return true;
    }

    const proceed = await requestConsent({
      workspaceId: currentWorkspace?.id ?? null,
      workspaceName: currentWorkspace?.name,
      subject: 'This file',
      fromSchemaVersion: pendingMigration.schema,
      toSchemaVersion: CURRENT_SCHEMA_VERSION,
    });

    if (proceed) {
      setPendingMigration(null);
    }

    return proceed;
  }, [currentWorkspace, pendingMigration, requestConsent, setPendingMigration]);
};

export default useMigrationConsentGuard;
