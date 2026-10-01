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
import getThreatReportFields from '.';
import { STATUS_NOT_SET } from '../../configs/status';
import { DataExchangeFormat, TemplateThreatStatement } from '../../customTypes';

const threat: TemplateThreatStatement = {
  id: 't1',
  numericId: 1,
  status: 'threatResolved',
  metadata: [
    { key: 'Priority', value: 'High' },
    { key: 'STRIDE', value: ['S', 'T'] },
    { key: 'Comments', value: 'not a report field' },
    { key: 'custom:TMT Description', value: 'An attacker may spoof the client.' },
    { key: 'custom:TMT Title', value: 'Spoofing' },
    { key: 'custom:Owner', value: ['Ana', 'Ben'] },
  ],
};

const data: DataExchangeFormat = {
  schema: 1.1,
  threats: [threat],
  mitigations: [
    { id: 'm1', numericId: 1, content: 'Use mutual TLS' },
    { id: 'm2', numericId: 2, content: 'Unlinked' },
  ],
  assumptions: [{ id: 'a1', numericId: 7, content: 'The network is private' }],
  mitigationLinks: [
    { linkedId: 't1', mitigationId: 'm1' },
    { linkedId: 't1', mitigationId: 'missing' },
    { linkedId: 'other', mitigationId: 'm2' },
  ],
  assumptionLinks: [{ linkedId: 't1', assumptionId: 'a1', type: 'Threat' }],
};

describe('getThreatReportFields', () => {
  test('returns the status label, priority, and STRIDE letters', () => {
    const fields = getThreatReportFields(threat, data);
    expect(fields.status).toBe('Resolved');
    expect(fields.priority).toBe('High');
    expect(fields.stride).toBe('S, T');
  });

  test('defaults the status, priority, and STRIDE when the threat has none', () => {
    const fields = getThreatReportFields({ id: 't2', numericId: 2 }, data);
    expect(fields.status).toBe(STATUS_NOT_SET);
    expect(fields.priority).toBe('');
    expect(fields.stride).toBe('');
  });

  test('lists the TMT description separately from the other custom entries', () => {
    const fields = getThreatReportFields(threat, data);
    expect(fields.tmtDescription).toBe('An attacker may spoof the client.');
    expect(fields.customMetadata).toEqual([
      { name: 'TMT Title', value: 'Spoofing' },
      { name: 'Owner', value: 'Ana, Ben' },
    ]);
  });

  test('lists linked mitigations and assumptions with their display IDs, skipping missing ones', () => {
    const fields = getThreatReportFields(threat, data);
    expect(fields.mitigations).toEqual([{ id: 'M-0001', content: 'Use mutual TLS' }]);
    expect(fields.assumptions).toEqual([{ id: 'A-0007', content: 'The network is private' }]);
  });
});
