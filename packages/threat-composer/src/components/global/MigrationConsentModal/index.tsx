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
import Header from '@cloudscape-design/components/header';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { FC } from 'react';
import { useMigrationConsentContext } from '../../../contexts/MigrationConsentContext';

const MigrationConsentModal: FC = () => {
  const { pendingRequest, confirm, cancel } = useMigrationConsentContext();

  // Only mount the Cloudscape Modal while actually prompting; a permanently mounted
  // (hidden) modal stays in the DOM and participates in resize observation.
  if (!pendingRequest) {
    return null;
  }

  const { workspaceName, fromSchemaVersion, toSchemaVersion } = pendingRequest;
  // TODO: (US-3-T3): revisit version display when schema versions move off floats.
  const formatVersion = (v: number) => v.toFixed(1);

  return (
    <Modal
      visible
      header={<Header>{`Upgrade this threat model from ${formatVersion(fromSchemaVersion)} to the current ${formatVersion(toSchemaVersion)} format?`}</Header>}
      onDismiss={cancel}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={cancel}>Cancel</Button>
            <Button variant="primary" onClick={confirm}>Upgrade and open</Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="s">
        <Box>
          {workspaceName
            ? `The workspace "${workspaceName}" was saved in an older Data Flow format and must be upgraded before it can be opened.`
            : 'This workspace was saved in an older Data Flow format and must be upgraded before it can be opened.'}
        </Box>
        <Box>
          Upgrading changes how the Data Flow diagram is stored. Older versions of Threat Composer may no
          longer be able to open the upgraded model, so consider exporting a backup first.
        </Box>
        <Box>Cancel to leave this workspace unchanged and unopened.</Box>
      </SpaceBetween>
    </Modal>
  );
};

export default MigrationConsentModal;
