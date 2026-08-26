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
import { DataExchangeFormat, DataflowDiagram, DataflowInfo } from '../../customTypes';

export const DEFAULT_DATAFLOW_DIAGRAM_NAME = 'Diagram 1';

export const CURRENT_SCHEMA_VERSION = 1.1;

// The schema version indicated by a legacy dataflow that still carries the removed 'image' key.
export const LEGACY_DATAFLOW_SCHEMA_VERSION = 1.0;

// Schema 1.0 stored a single dataflow.image; 1.1 replaces it with a diagrams collection.
export interface LegacyDataflowInfo {
  description?: string;
  image?: string;
}

type DataExchangeMigrationInput = Omit<DataExchangeFormat, 'schema' | 'dataflow'> & {
  schema: number;
  dataflow?: DataflowInfo | LegacyDataflowInfo;
};

export const migrateDataflowInfo = (dataflow: DataflowInfo | LegacyDataflowInfo): DataflowInfo => {
  const source = dataflow as { description?: string; image?: string; diagrams?: DataflowDiagram[] };

  // Already 1.1-shaped: fold any stray top-level description (transitional dev data) into the first diagram.
  if (source.diagrams) {
    const [first, ...rest] = source.diagrams;
    if (source.description && first && !first.description) {
      return { diagrams: [{ ...first, description: source.description }, ...rest] };
    }
    return { diagrams: source.diagrams };
  }

  // Legacy single image -> one diagram carrying that image and the former shared intro.
  if (source.image) {
    return { diagrams: [{ id: crypto.randomUUID(), name: DEFAULT_DATAFLOW_DIAGRAM_NAME, image: source.image, description: source.description }] };
  }

  // Legacy intro with no image -> one text-only diagram so the introduction survives.
  if (source.description) {
    return { diagrams: [{ id: crypto.randomUUID(), name: DEFAULT_DATAFLOW_DIAGRAM_NAME, description: source.description }] };
  }

  return { diagrams: [] };
};

// A stored schema-1.0 dataflow carries the removed 'image' key or a top-level intro; 1.1 uses 'diagrams'.
// The empty default { description: '' } must not be flagged, so a bare description only counts when non-empty.
export const dataflowInfoNeedsMigration = (dataflow?: DataflowInfo | LegacyDataflowInfo | null): boolean => {
  if (!dataflow) {
    return false;
  }
  const source = dataflow as { image?: string; description?: string; diagrams?: unknown };
  if (source.diagrams) {
    return false;
  }
  if ('image' in source) {
    return true;
  }
  return !!source.description;
};

// Single-step schema migrations. Each entry migrates a document from its key version
// to `to` (the immediately following version). Add a new schema version by registering
// one more single-step entry; migrateToCurrent composes the chain, so no call site changes.
// TODO: (US-3-T3): retire the float version keys (1.0/1.1) in favour of integer/semver.
interface SchemaMigrationStep {
  to: number;
  migrate: (input: DataExchangeMigrationInput) => DataExchangeMigrationInput;
}

const migrateSchema1_0To1_1 = (input: DataExchangeMigrationInput): DataExchangeMigrationInput => {
  const { dataflow, ...rest } = input;
  return dataflow ? { ...rest, dataflow: migrateDataflowInfo(dataflow) } : { ...rest };
};

const SCHEMA_MIGRATIONS: Partial<Record<number, SchemaMigrationStep>> = {
  1.0: { to: 1.1, migrate: migrateSchema1_0To1_1 },
};

export const SUPPORTED_SCHEMA_VERSIONS = [
  ...Object.keys(SCHEMA_MIGRATIONS).map(Number),
  CURRENT_SCHEMA_VERSION,
];

// Shared entry point for every path that ingests a stored/imported model
// (persistence-load, file-import, IDE injection): walk any supported version up to
// current via single steps. Validation is a separate concern applied by the caller.
export const migrateToCurrent = (input: DataExchangeMigrationInput): DataExchangeFormat => {
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(input.schema)) {
    throw new Error(`Unsupported Schema version: ${input.schema}`);
  }

  let doc = input;
  while (doc.schema !== CURRENT_SCHEMA_VERSION) {
    const step = SCHEMA_MIGRATIONS[doc.schema];
    if (!step) {
      throw new Error(`No migration path from schema ${doc.schema}`);
    }
    doc = { ...step.migrate(doc), schema: step.to };
  }

  return doc as DataExchangeFormat;
};

const migrateDataExchange = (input: DataExchangeMigrationInput): DataExchangeFormat => migrateToCurrent(input);

export default migrateDataExchange;
