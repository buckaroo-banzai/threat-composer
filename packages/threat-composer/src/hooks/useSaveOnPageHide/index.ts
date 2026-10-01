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
import { useEffect, useRef } from 'react';

// Calls the latest 'save' when the page is closed or hidden; 'beforeunload' is not fired reliably by browsers.
const useSaveOnPageHide = (save: () => void) => {
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const handlePageHide = () => saveRef.current();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveRef.current();
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

export default useSaveOnPageHide;
