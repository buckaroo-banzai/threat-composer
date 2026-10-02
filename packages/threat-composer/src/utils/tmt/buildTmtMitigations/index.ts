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
import { MITIGATION_STATUS_IDENTIFIED } from '../../../configs';
import { Mitigation, MitigationLink } from '../../../customTypes';
import sanitizeHtml from '../../sanitizeHtml';
import { TmtThreatMitigations } from '../convertTmtThreats';

export interface TmtMitigations {
  mitigations: Mitigation[];
  mitigationLinks: MitigationLink[];
}

const displayedText = (content: string): string => sanitizeHtml(content).replace(/\s+/g, ' ').trim();

/**
 * Creates one Threat Composer mitigation per distinct displayed text, numbered in order of first appearance,
 * and links it to every threat it applies to.
 */
export const buildTmtMitigations = (mitigationsByThreat: TmtThreatMitigations[]): TmtMitigations => {
  const mitigationByText = new Map<string, Mitigation>();
  const mitigationLinks: MitigationLink[] = [];
  for (const { threatId, contents } of mitigationsByThreat) {
    const linkedMitigationIds = new Set<string>();
    for (const content of contents) {
      const text = displayedText(content);
      let mitigation = mitigationByText.get(text);
      if (!mitigation) {
        mitigation = {
          id: crypto.randomUUID(),
          numericId: mitigationByText.size + 1,
          content,
          status: MITIGATION_STATUS_IDENTIFIED,
        };
        mitigationByText.set(text, mitigation);
      }
      if (!linkedMitigationIds.has(mitigation.id)) {
        linkedMitigationIds.add(mitigation.id);
        mitigationLinks.push({ mitigationId: mitigation.id, linkedId: threatId });
      }
    }
  }
  return { mitigations: [...mitigationByText.values()], mitigationLinks };
};
