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
import { METADATA_KEY_PREFIX_CUSTOM } from '../../configs';
import { EntityBase, MetadataSchemaMinimal } from '../../customTypes';

// Applied to the latest stored entity, so updates saved in the same event build on each other.
export type EntityUpdate = <T extends EntityBase>(entity: T) => T;

export const updateEntityById = <T extends EntityBase>(entities: T[], id: string, update: EntityUpdate): T[] => {
  const index = entities.findIndex((entity) => entity.id === id);
  if (index < 0) {
    return entities;
  }
  return [...entities.slice(0, index), update(entities[index]), ...entities.slice(index + 1)];
};

// Same semantics as useEditMetadata: replace in place, append when new, remove when empty.
export const setMetadataValue = (key: string, value: string | string[] | undefined): EntityUpdate => (entity) => {
  const metadata = entity.metadata || [];
  if (!value) {
    return { ...entity, metadata: metadata.filter((m) => m.key !== key) };
  }
  const index = metadata.findIndex((m) => m.key === key);
  return {
    ...entity,
    metadata: index >= 0
      ? [...metadata.slice(0, index), { key, value }, ...metadata.slice(index + 1)]
      : [...metadata, { key, value }],
  };
};

export const getCustomMetadataEntries = (entity: EntityBase) =>
  (entity.metadata || []).filter((m) => m.key.startsWith(METADATA_KEY_PREFIX_CUSTOM));

// Replaces all custom entries; leaves the entity unchanged if any entry breaks the schema or repeats a key.
export const setCustomMetadataEntries = (entries: { key: string; value: string | string[] }[]): EntityUpdate => (entity) => {
  const keys = entries.map((e) => e.key);
  if (
    new Set(keys).size !== keys.length ||
    entries.some((e) => !e.key.startsWith(METADATA_KEY_PREFIX_CUSTOM) || !MetadataSchemaMinimal.safeParse(e).success)
  ) {
    return entity;
  }
  return {
    ...entity,
    metadata: [...(entity.metadata || []).filter((m) => !m.key.startsWith(METADATA_KEY_PREFIX_CUSTOM)), ...entries],
  };
};
