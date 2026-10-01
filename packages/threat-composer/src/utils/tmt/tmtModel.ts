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

// The parsed, minimally-interpreted contents of a Microsoft TMT '.tm7' model (data only, no diagram
// geometry). Values are preserved as raw strings; mapping to Threat Composer entities happens later.

export interface TmtMetaInformation {
  threatModelName?: string;
  highLevelSystemDescription?: string;
  owner?: string;
  reviewer?: string;
  contributors?: string;
  assumptions?: string;
  externalDependencies?: string;
}

export interface TmtDrawingSurface {
  guid: string;
  name: string;
  isEmpty: boolean; // no stencil elements (Borders) and no connectors (Lines)
  order: number; // position within DrawingSurfaceList, in document order
}

export interface TmtThreat {
  id: number;
  key: string; // ThreatInstances dictionary key (composite)
  typeId?: string; // reference to a knowledge-base ThreatType
  state?: string; // raw ThreatState enum name, e.g. 'Mitigated'
  priority?: string; // raw priority string
  sourceGuid?: string;
  targetGuid?: string;
  flowGuid?: string;
  drawingSurfaceGuid?: string;
  interactionKey?: string;
  properties: Record<string, string>; // the raw per-instance Properties bag
}

export interface TmtNote {
  id: number;
  message: string;
  addedBy?: string;
  date?: string;
}

export interface TmtThreatType {
  id: string;
  shortTitle?: string; // title template with {source.Name}/{flow.Name}/{target.Name} placeholders
  category?: string;
  description?: string;
}

export interface TmtKnowledgeBase {
  threatTypes: Record<string, TmtThreatType>; // keyed by ThreatType.Id
  propertyLabels: Record<string, string>; // ThreatMetaDatum Name -> Label
}

export interface TmtModel {
  version: string; // <Version>; a successfully parsed model always has '4.3'
  metadata: TmtMetaInformation;
  surfaces: TmtDrawingSurface[]; // DrawingSurfaceList, in document order
  elementNames: Record<string, string>; // DFD element and data-flow GUID -> Name, across all surfaces
  threats: TmtThreat[]; // ThreatInstances dictionary values
  notes: TmtNote[]; // ordered by Id
  knowledgeBase: TmtKnowledgeBase;
}
