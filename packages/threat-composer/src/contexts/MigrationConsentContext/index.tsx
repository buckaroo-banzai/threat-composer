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
import { FC, PropsWithChildren, useCallback, useRef, useState } from 'react';
import { MigrationConsentContext, MigrationConsentRequest, useMigrationConsentContext } from './context';
import { DataExchangeFormat } from '../../customTypes';

const MigrationConsentContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [pendingRequest, setPendingRequest] = useState<MigrationConsentRequest | null>(null);
  const [pendingMigration, setPendingMigration] = useState<DataExchangeFormat | null>(null);
  const resolverRef = useRef<((proceed: boolean) => void) | null>(null);

  const requestConsent = useCallback((request: MigrationConsentRequest) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPendingRequest(request);
    });
  }, []);

  const resolve = useCallback((proceed: boolean) => {
    resolverRef.current?.(proceed);
    resolverRef.current = null;
    setPendingRequest(null);
  }, []);

  const confirm = useCallback(() => resolve(true), [resolve]);
  const cancel = useCallback(() => resolve(false), [resolve]);

  return (<MigrationConsentContext.Provider value={{
    pendingRequest,
    pendingMigration,
    requestConsent,
    setPendingMigration,
    confirm,
    cancel,
  }}>
    {children}
  </MigrationConsentContext.Provider>);
};

export default MigrationConsentContextProvider;

export {
  useMigrationConsentContext,
};
