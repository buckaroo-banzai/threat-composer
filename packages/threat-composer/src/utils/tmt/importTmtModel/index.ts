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
import { CURRENT_SCHEMA_VERSION } from '../../../configs';
import { DataExchangeFormat } from '../../../customTypes';
import { buildTmtMitigations } from '../buildTmtMitigations';
import { convertTmtThreats, TmtUnconvertibleThreat } from '../convertTmtThreats';
import { extractTmtReportDiagrams } from '../extractTmtReportDiagrams';
import { formatTmtModelData } from '../formatTmtModelData';
import { parseTmtModel } from '../parseTmtModel';

export interface TmtImportResult {
  workspaceName: string;
  data: DataExchangeFormat;
  unconvertible: TmtUnconvertibleThreat[];
  warnings: string[];
}

const fileNameWithoutExtension = (fileName?: string): string => (fileName ?? '').replace(/\.[^./\\]+$/, '').trim();

/**
 * Runs the full Microsoft TMT import pipeline: parse the '.tm7', extract the DFD images from the Full
 * Report, convert the threats, and assemble a schema-1.1 Threat Composer DataExchangeFormat. Blocking
 * problems (invalid '.tm7', report/surface mismatch) throw; unconvertible threats and non-blocking
 * warnings are returned for the caller to present. The returned data is raw: the caller must route it
 * through the standard import boundary (sanitizeHtml + validateData) before persisting it.
 */
export const importTmtModel = (tm7Xml: string, reportHtml: string, fileName?: string): TmtImportResult => {
  const model = parseTmtModel(tm7Xml);
  const diagrams = extractTmtReportDiagrams(reportHtml, model.surfaces);
  const { threats, unconvertible, warnings, mitigationsByThreat } = convertTmtThreats(model);
  const { mitigations, mitigationLinks } = buildTmtMitigations(mitigationsByThreat);
  const description = formatTmtModelData(model);

  const workspaceName =
    model.metadata.threatModelName?.trim() || fileNameWithoutExtension(fileName) || 'Microsoft TMT Model';

  const data: DataExchangeFormat = {
    schema: CURRENT_SCHEMA_VERSION,
    applicationInfo: {
      name: workspaceName,
      ...(description ? { description } : {}),
    },
    dataflow: {
      diagrams: diagrams.map((diagram) => ({
        id: crypto.randomUUID(),
        name: diagram.name,
        image: diagram.image,
      })),
    },
    threats,
    mitigations,
    mitigationLinks,
  };

  return { workspaceName, data, unconvertible, warnings };
};
