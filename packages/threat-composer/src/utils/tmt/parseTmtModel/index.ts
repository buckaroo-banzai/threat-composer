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
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { MAX_TM7_CHARS } from '../../../configs';
import { TmtDrawingSurface, TmtModel, TmtNote, TmtThreat, TmtThreatType } from '../tmtModel';

const TMT_MODEL_NAMESPACE = 'http://schemas.datacontract.org/2004/07/ThreatModeling.Model';
const SUPPORTED_VERSION = '4.3';

const toArray = <T>(value: T | T[] | undefined | null): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];

// A DataContractSerializer element is a bare string (text only), an object with '#text' (text plus
// attributes), or an object with '@_nil' (xsi:nil). Normalize any of these to a string or undefined.
const text = (node: any): string | undefined => {
  if (node == null) {
    return undefined;
  }
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }
  if (typeof node === 'object') {
    if (node['@_nil'] === 'true') {
      return undefined;
    }
    if ('#text' in node) {
      return String(node['#text']);
    }
  }
  return undefined;
};

const optText = (node: any): string | undefined => {
  const value = text(node);
  return value === undefined || value === '' ? undefined : value;
};

const toInt = (node: any): number | undefined => {
  const value = text(node);
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
};

// A DataContractSerializer dictionary is <Dict><KeyValueOf...><Key/><Value/></KeyValueOf...></Dict>;
// the entry element name is type-mangled (e.g. KeyValueOfstringThreatpc_P0_PhOB), so match by prefix.
const dictionaryEntries = (dict: any, entryPrefix: string): Array<{ Key: any; Value: any }> => {
  if (!dict || typeof dict !== 'object') {
    return [];
  }
  const entryKey = Object.keys(dict).find((key) => key.startsWith(entryPrefix));
  return entryKey ? toArray(dict[entryKey]) : [];
};

// The StringDisplayAttribute whose DisplayName is 'Name' (surfaces, stencil elements, and connectors).
const nameProperty = (node: any): string | undefined =>
  optText(toArray(node?.Properties?.anyType).find((attr: any) => text(attr.DisplayName) === 'Name')?.Value);

const surfaceName = (surface: any): string => optText(surface.Header) || nameProperty(surface) || '';

const surfaceIsEmpty = (surface: any): boolean =>
  dictionaryEntries(surface.Borders, 'KeyValueOfguidanyType').length === 0 &&
  dictionaryEntries(surface.Lines, 'KeyValueOfguidanyType').length === 0;

/**
 * Parses and validates a Microsoft TMT '.tm7' document (DataContractSerializer XML) into a neutral
 * TmtModel. Throws an explicit error on invalid, unsupported-version, or malicious input.
 * Extracted string values are raw and UNSANITIZED; consumers MUST sanitize/escape them before
 * rendering to HTML or Markdown.
 */
export const parseTmtModel = (xml: string, options: { maxChars?: number } = {}): TmtModel => {
  const maxChars = options.maxChars ?? MAX_TM7_CHARS;
  if (typeof xml !== 'string' || xml.length === 0) {
    throw new Error('Empty .tm7 input');
  }
  if (xml.length > maxChars) {
    throw new Error('.tm7 input exceeds the maximum allowed size');
  }
  // Reject any DTD/entity declaration outright (XXE / billion-laughs defense) before parsing.
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
    throw new Error('.tm7 must not contain a DOCTYPE or ENTITY declaration');
  }
  // Require the TMT ThreatModel root in its expected namespace, validated on the raw text because
  // removeNSPrefix strips namespace declarations during parsing.
  if (!/<ThreatModel[\s>]/.test(xml) || !xml.includes(`xmlns="${TMT_MODEL_NAMESPACE}"`)) {
    throw new Error('Not a TMT .tm7 model (missing <ThreatModel> root in the expected namespace)');
  }
  let validation: ReturnType<typeof XMLValidator.validate>;
  try {
    validation = XMLValidator.validate(xml);
  } catch (e) {
    throw new Error(`Malformed .tm7 XML: ${(e as Error).message}`);
  }
  if (validation !== true) {
    throw new Error(`Malformed .tm7 XML: ${validation.err?.msg ?? 'invalid XML'}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    // Entity processing is left at its safe default: DOCTYPE/ENTITY are rejected above so no custom
    // entity can expand, and turning it off would corrupt legitimate predefined entities like &amp;.
  });

  let parsed: any;
  try {
    parsed = parser.parse(xml);
  } catch (e) {
    throw new Error(`Malformed .tm7 XML: ${(e as Error).message}`);
  }

  const root = parsed?.ThreatModel;
  if (!root || typeof root !== 'object') {
    throw new Error('Not a TMT ThreatModel document (missing <ThreatModel> root)');
  }
  const version = text(root.Version);
  if (version !== SUPPORTED_VERSION) {
    throw new Error(`Unsupported TMT model version: ${version ?? '(none)'} (expected ${SUPPORTED_VERSION})`);
  }

  const surfaceModels = toArray(root.DrawingSurfaceList?.DrawingSurfaceModel);
  const surfaces: TmtDrawingSurface[] = surfaceModels.map(
    (surface: any, index: number) => ({
      guid: text(surface.Guid) || '',
      name: surfaceName(surface),
      isEmpty: surfaceIsEmpty(surface),
      order: index,
    }),
  );

  // Untrusted GUIDs become object keys here; use a null-prototype map to avoid pollution.
  const elementNames: Record<string, string> = Object.create(null);
  for (const surface of surfaceModels) {
    for (const entry of [
      ...dictionaryEntries(surface.Borders, 'KeyValueOfguidanyType'),
      ...dictionaryEntries(surface.Lines, 'KeyValueOfguidanyType'),
    ]) {
      const guid = optText(entry.Value?.Guid) ?? optText(entry.Key);
      const name = nameProperty(entry.Value);
      if (guid && name) {
        elementNames[guid] = name;
      }
    }
  }

  const threats: TmtThreat[] = dictionaryEntries(root.ThreatInstances, 'KeyValueOfstringThreat').map((entry: any) => {
    const value = entry.Value || {};
    const id = toInt(value.Id);
    if (id === undefined) {
      throw new Error('A .tm7 threat instance is missing a valid integer Id');
    }
    // Untrusted XML text becomes object keys here; use a null-prototype map to avoid pollution.
    const properties: Record<string, string> = Object.create(null);
    for (const property of dictionaryEntries(value.Properties, 'KeyValueOfstringstring')) {
      const key = text(property.Key);
      if (key !== undefined) {
        properties[key] = text(property.Value) ?? '';
      }
    }
    return {
      id,
      key: text(entry.Key) || '',
      typeId: optText(value.TypeId),
      state: optText(value.State),
      priority: optText(value.Priority),
      sourceGuid: optText(value.SourceGuid),
      targetGuid: optText(value.TargetGuid),
      flowGuid: optText(value.FlowGuid),
      drawingSurfaceGuid: optText(value.DrawingSurfaceGuid),
      interactionKey: optText(value.InteractionKey),
      properties,
    };
  });

  const notes: TmtNote[] = toArray(root.Notes?.Note)
    .map((note: any) => ({
      id: toInt(note.Id) ?? 0,
      message: text(note.Message) || '',
      addedBy: optText(note.AddedBy),
      date: optText(note.Date),
    }))
    .sort((a, b) => a.id - b.id);

  const meta = root.MetaInformation || {};
  const metadata = {
    threatModelName: optText(meta.ThreatModelName),
    highLevelSystemDescription: optText(meta.HighLevelSystemDescription),
    owner: optText(meta.Owner),
    reviewer: optText(meta.Reviewer),
    contributors: optText(meta.Contributors),
    assumptions: optText(meta.Assumptions),
    externalDependencies: optText(meta.ExternalDependencies),
  };

  const kb = root.KnowledgeBase || {};
  // Untrusted ids/labels become object keys below; use null-prototype maps to avoid pollution.
  const threatTypes: Record<string, TmtThreatType> = Object.create(null);
  for (const threatType of toArray(kb.ThreatTypes?.ThreatType)) {
    const id = text(threatType.Id);
    if (id) {
      threatTypes[id] = {
        id,
        shortTitle: optText(threatType.ShortTitle),
        category: optText(threatType.Category),
        description: optText(threatType.Description),
      };
    }
  }
  const propertyLabels: Record<string, string> = Object.create(null);
  for (const datum of toArray(kb.ThreatMetaData?.PropertiesMetaData?.ThreatMetaDatum)) {
    const name = text(datum.Name);
    const label = text(datum.Label);
    if (name && label) {
      propertyLabels[name] = label;
    }
  }

  return {
    version,
    metadata,
    surfaces,
    elementNames,
    threats,
    notes,
    knowledgeBase: { threatTypes, propertyLabels },
  };
};
