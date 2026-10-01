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
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import WindowExporter from '.';
import { DataExchangeFormat } from '../../../customTypes';

// Holds the loaded threats in React state, so each render returns a new getWorkspaceData, as the real hook does.
jest.mock('../../../hooks/useExportImport', () => {
  const { useState } = jest.requireActual('react');
  return {
    __esModule: true,
    PLACEHOLDER_EXCHANGE_DATA: { schema: 1.1 },
    default: () => {
      const [threats, setThreats] = useState([]);
      return {
        getWorkspaceData: () => ({ schema: 1.1, threats }),
        parseImportedData: (data: DataExchangeFormat) => ({ ...data, schema: 1.1 }),
        importData: async (data: DataExchangeFormat) => setThreats(data.threats ?? []),
      };
    },
  };
});

jest.mock('../../../contexts', () => ({
  useWorkspacesContext: () => ({ currentWorkspace: null, workspaceList: [] }),
}));

jest.mock('../../../contexts/MigrationConsentContext', () => ({
  useMigrationConsentContext: () => ({
    pendingMigration: null,
    setPendingMigration: () => {},
    requestConsent: async () => true,
  }),
}));

jest.mock('../../../hooks/useRemoveData', () => () => ({ deleteWorkspace: () => {} }));

jest.mock('../../../utils/convertToMarkdown', () => () => '');

const schema10Document = {
  schema: 1.0,
  threats: [{ id: 't1', numericId: 1, threatAction: 'tamper with data' }],
};

describe('WindowExporter setCurrentWorkspaceData', () => {
  let container: HTMLDivElement;
  let root: Root;
  const savedData: unknown[] = [];

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    savedData.length = 0;
    window.threatcomposer = {
      addEventListener: () => {},
      dispatchEvent: (event: CustomEvent) => savedData.push(event.detail),
      stringifyWorkspaceData: () => '',
    } as any;
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  // Covers the bug where the save sent after Upgrade carried the workspace as it was before the load.
  test('saves the loaded data when the user consents to the schema upgrade', async () => {
    await act(async () => root.render(<WindowExporter />));

    await act(async () => {
      await window.threatcomposer.setCurrentWorkspaceData!(schema10Document);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(savedData).toEqual([{ schema: 1.1, threats: schema10Document.threats }]);
  });
});
