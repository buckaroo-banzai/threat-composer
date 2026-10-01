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
import { METADATA_KEY_PREFIX_CUSTOM, METADATA_KEY_PRIORITY, METADATA_KEY_STRIDE } from '../../configs';
import { STATUS_NOT_SET } from '../../configs/status';
import { Assumption, DataExchangeFormat, Mitigation, TemplateThreatStatement } from '../../customTypes';
import threatStatus from '../../data/status/threatStatus.json';
import standardizeNumericId from '../standardizeNumericId';

const TMT_DESCRIPTION_KEY = `${METADATA_KEY_PREFIX_CUSTOM}TMT Description`;

export interface LinkedReportItem {
  id: string;
  content: string;
}

export interface ThreatReportFields {
  status: string;
  priority: string;
  stride: string;
  tmtDescription: string;
  customMetadata: { name: string; value: string }[];
  mitigations: LinkedReportItem[];
  assumptions: LinkedReportItem[];
}

const joinValue = (value: string | string[]) => (Array.isArray(value) ? value.join(', ') : value);

const toLinkedReportItems = (prefix: string, items: (Mitigation | Assumption | undefined)[]): LinkedReportItem[] =>
  items
    .filter((item): item is Mitigation | Assumption => item !== undefined)
    .map((item) => ({ id: `${prefix}-${standardizeNumericId(item.numericId)}`, content: item.content }));

// The per-threat values both the Markdown and Word reports show; the TMT description is listed before the other custom entries.
const getThreatReportFields = (threat: TemplateThreatStatement, data: DataExchangeFormat): ThreatReportFields => {
  const metadata = threat.metadata || [];
  const tmtDescription = metadata.find((m) => m.key === TMT_DESCRIPTION_KEY);
  return {
    status: (threat.status && threatStatus.find((s) => s.value === threat.status)?.label) || STATUS_NOT_SET,
    priority: (metadata.find((m) => m.key === METADATA_KEY_PRIORITY)?.value as string) || '',
    stride: ((metadata.find((m) => m.key === METADATA_KEY_STRIDE)?.value || []) as string[]).join(', '),
    tmtDescription: tmtDescription ? joinValue(tmtDescription.value) : '',
    customMetadata: metadata
      .filter((m) => m.key.startsWith(METADATA_KEY_PREFIX_CUSTOM) && m.key !== TMT_DESCRIPTION_KEY)
      .map((m) => ({ name: m.key.slice(METADATA_KEY_PREFIX_CUSTOM.length), value: joinValue(m.value) })),
    mitigations: toLinkedReportItems('M', (data.mitigationLinks || [])
      .filter((link) => link.linkedId === threat.id)
      .map((link) => data.mitigations?.find((m) => m.id === link.mitigationId))),
    assumptions: toLinkedReportItems('A', (data.assumptionLinks || [])
      .filter((link) => link.linkedId === threat.id)
      .map((link) => data.assumptions?.find((a) => a.id === link.assumptionId))),
  };
};

export default getThreatReportFields;
