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
import { FC, PropsWithChildren, useCallback, useMemo } from 'react';
import { WorkspaceExamplesContext, useWorkspaceExamplesContext } from './context';
import { EXAMPLES_WORKSPACE_ID_PREFIX, STORAGE_LOCAL_STATE } from '../../configs';
import workspaceExamplesData from '../../data/workspaceExamples/workspaceExamples';
import migrateDataExchange from '../../utils/migrateDataExchange';

const WorkspaceExamplesContextProvider: FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const workspaceExamples = useMemo(() => {
    // Bundled examples are read-only, so upgrade them to the current schema in memory
    // (no consent needed) at this boundary before they seed the local-state providers.
    return workspaceExamplesData.map(x => ({
      ...x,
      id: `${EXAMPLES_WORKSPACE_ID_PREFIX}${x.name.replace(/\s/g, '')}`,
      storageType: STORAGE_LOCAL_STATE,
      value: migrateDataExchange(x.value),
    }));
  }, [workspaceExamplesData]);

  const handleGetWorkspaceExample = useCallback((workspaceExampleId?: string | null) => {
    if (workspaceExampleId) {
      return workspaceExamples.find(x => x.id === workspaceExampleId);
    }

    return undefined;
  }, [workspaceExamples]);

  return (<WorkspaceExamplesContext.Provider value={{
    workspaceExamples,
    getWorkspaceExample: handleGetWorkspaceExample,
  }}>
    {children}
  </WorkspaceExamplesContext.Provider>);
};

export default WorkspaceExamplesContextProvider;

export {
  useWorkspaceExamplesContext,
};

