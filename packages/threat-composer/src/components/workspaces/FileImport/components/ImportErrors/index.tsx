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
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import TextContent from '@cloudscape-design/components/text-content';
import { FC } from 'react';
import { TmtUnconvertibleThreat } from '../../../../../utils/tmt/convertTmtThreats';

export interface ImportErrorsProps {
  visible: boolean;
  unconvertible: TmtUnconvertibleThreat[];
  warnings: string[];
  onAbort: () => void;
  onIgnore: () => void;
}

const ImportErrors: FC<ImportErrorsProps> = ({ visible, unconvertible, warnings, onAbort, onIgnore }) => {
  const hasErrors = unconvertible.length > 0;
  return <Modal
    visible={visible}
    header={hasErrors ? 'Import errors' : 'Review import warnings'}
    onDismiss={onAbort}
    footer={
      <Box float="right">
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onAbort}>Abort</Button>
          <Button variant="primary" onClick={onIgnore}>Ignore and continue</Button>
        </SpaceBetween>
      </Box>
    }
  >
    <SpaceBetween direction="vertical" size="m">
      <TextContent>
        {hasErrors
          ? 'Some content in this model could not be imported. Review the items below, then either abort to fix the source model, or ignore them and import the rest.'
          : 'Some threats were imported with adjustments. Review them below, then abort or continue.'}
      </TextContent>
      {hasErrors && <TextContent key="unconvertible">
        <h4>Threats that could not be imported ({unconvertible.length})</h4>
        <p>These threats will be omitted from the import:</p>
        <ul>
          {unconvertible.map((item, index) => <li key={index}>TMT threat {item.id}: {item.reason}</li>)}
        </ul>
      </TextContent>}
      {warnings.length > 0 && <TextContent key="warnings">
        <h4>Warnings ({warnings.length})</h4>
        <p>These threats were imported with adjustments:</p>
        <ul>
          {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
        </ul>
      </TextContent>}
    </SpaceBetween>
  </Modal>;
};

export default ImportErrors;
