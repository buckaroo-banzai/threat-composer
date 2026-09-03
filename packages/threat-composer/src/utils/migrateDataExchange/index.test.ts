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
import migrateDataExchange, { DEFAULT_DATAFLOW_DIAGRAM_NAME, dataExchangeNeedsMigration, dataflowInfoNeedsMigration, migrateDataflowInfo, migrateToCurrent } from '.';
import { DataExchangeFormat, DataflowInfo } from '../../customTypes';
import threatComposer from '../../data/workspaceExamples/ThreatComposer.tc.json';
import validateData from '../validateData';

const SAMPLE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HBSdAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('migrateDataExchange - schema 1.0 -> 1.1', () => {
  test('moves a single dataflow.image into diagrams[0] and strips the legacy image key', () => {
    const result = migrateDataExchange({
      schema: 1.0,
      dataflow: { image: SAMPLE_IMAGE, description: 'flow desc' },
    });

    expect(result.schema).toBe(1.1);
    expect(result.dataflow?.diagrams?.[0].description).toBe('flow desc');
    expect(result.dataflow?.diagrams).toHaveLength(1);
    expect(result.dataflow?.diagrams?.[0].image).toBe(SAMPLE_IMAGE);
    expect(result.dataflow?.diagrams?.[0].name).toBe(DEFAULT_DATAFLOW_DIAGRAM_NAME);
    expect(result.dataflow?.diagrams?.[0].id).toHaveLength(36);
    expect((result.dataflow as Record<string, unknown>).image).toBeUndefined();
  });

  test('migrates a description-only dataflow into a single text-only diagram', () => {
    const result = migrateDataExchange({
      schema: 1.0,
      dataflow: { description: 'flow desc only' },
    });

    expect(result.dataflow?.diagrams).toHaveLength(1);
    expect(result.dataflow?.diagrams?.[0].description).toBe('flow desc only');
    expect(result.dataflow?.diagrams?.[0].image).toBeUndefined();
    expect(result.dataflow?.diagrams?.[0].name).toBe(DEFAULT_DATAFLOW_DIAGRAM_NAME);
    expect((result.dataflow as Record<string, unknown>).image).toBeUndefined();
  });

  test('leaves dataflow undefined when the source has none', () => {
    const result = migrateDataExchange({ schema: 1.0, applicationInfo: {} });

    expect(result.schema).toBe(1.1);
    expect(result.dataflow).toBeUndefined();
  });

  test('produces output that passes schema 1.1 validation for the real 1.0 fixture', () => {
    const result = migrateDataExchange(threatComposer as unknown as DataExchangeFormat);
    expect(validateData(result).success).toBe(true);
    expect(result.dataflow?.diagrams?.length).toBeGreaterThanOrEqual(1);
  });
});

describe('migrateDataExchange - schema 1.1 passthrough', () => {
  test('is idempotent for an already-1.1 document', () => {
    const already: DataExchangeFormat = {
      schema: 1.1,
      dataflow: {
        diagrams: [{ id: '11111111-1111-4111-8111-111111111111', name: 'D1', image: SAMPLE_IMAGE }],
      },
    };

    const result = migrateDataExchange(already);
    expect(result.dataflow?.diagrams).toHaveLength(1);
    expect(result.dataflow?.diagrams?.[0].id).toBe('11111111-1111-4111-8111-111111111111');
    expect((result.dataflow as Record<string, unknown>).image).toBeUndefined();
  });
});

describe('migrateDataExchange - unsupported versions', () => {
  test('throws for an unsupported schema version', () => {
    expect(() => migrateDataExchange({ schema: 2 } as DataExchangeFormat)).toThrow('Unsupported Schema version');
  });
});

describe('migrateToCurrent - shared entry point', () => {
  test('routes a schema 1.0 document through the registry to 1.1', () => {
    const result = migrateToCurrent({
      schema: 1.0,
      dataflow: { image: SAMPLE_IMAGE, description: 'flow desc' },
    });

    expect(result.schema).toBe(1.1);
    expect(result.dataflow?.diagrams).toHaveLength(1);
    expect((result.dataflow as Record<string, unknown>).image).toBeUndefined();
  });

  test('is a passthrough for an already-current document', () => {
    const already: DataExchangeFormat = {
      schema: 1.1,
      dataflow: { diagrams: [] },
    };

    expect(migrateToCurrent(already)).toEqual(already);
  });

  test('throws for an unsupported schema version', () => {
    expect(() => migrateToCurrent({ schema: 2 } as DataExchangeFormat)).toThrow('Unsupported Schema version');
  });
});

describe('DataExchangeFormatSchema - schema 1.1 acceptance', () => {
  test('accepts a 1.1 dataflow with a diagrams array', () => {
    const doc: DataExchangeFormat = {
      schema: 1.1,
      dataflow: {
        diagrams: [{ id: '22222222-2222-4222-8222-222222222222', name: 'D1', image: SAMPLE_IMAGE, description: 'desc' }],
      },
    };
    expect(validateData(doc).success).toBe(true);
  });

  test('rejects a 1.1 dataflow that still carries a legacy image key', () => {
    const doc = {
      schema: 1.1,
      dataflow: { description: 'desc', image: SAMPLE_IMAGE, diagrams: [] },
    } as unknown as DataExchangeFormat;
    expect(validateData(doc).success).toBe(false);
  });
});

describe('migrateDataflowInfo - dataflow-only migration (US-1-T2)', () => {
  test('moves a legacy image into a one-item diagrams array and strips image', () => {
    const result = migrateDataflowInfo({ description: 'desc', image: SAMPLE_IMAGE });

    expect(result.diagrams).toHaveLength(1);
    expect(result.diagrams?.[0].image).toBe(SAMPLE_IMAGE);
    expect(result.diagrams?.[0].name).toBe(DEFAULT_DATAFLOW_DIAGRAM_NAME);
    expect(result.diagrams?.[0].id).toHaveLength(36);
    expect(result.diagrams?.[0].description).toBe('desc');
    expect((result as Record<string, unknown>).image).toBeUndefined();
  });

  test('does not mutate its input (no silent alteration of the stored model)', () => {
    const input = { description: 'Legacy intro', image: SAMPLE_IMAGE };
    const snapshot = JSON.parse(JSON.stringify(input));

    migrateDataflowInfo(input);

    expect(input).toEqual(snapshot);
  });

  test('turns a description-only dataflow into a single text-only diagram', () => {
    const result = migrateDataflowInfo({ description: 'desc only' });

    expect(result.diagrams).toHaveLength(1);
    expect(result.diagrams?.[0].description).toBe('desc only');
    expect(result.diagrams?.[0].image).toBeUndefined();
    expect((result as Record<string, unknown>).image).toBeUndefined();
  });

  test('is idempotent for an already-1.1 dataflow', () => {
    const already = { diagrams: [{ id: '11111111-1111-4111-8111-111111111111', name: 'D1', image: SAMPLE_IMAGE }] };

    const result = migrateDataflowInfo(already);

    expect(result.diagrams).toHaveLength(1);
    expect(result.diagrams?.[0].id).toBe('11111111-1111-4111-8111-111111111111');
    expect((result as Record<string, unknown>).image).toBeUndefined();
  });

  test('folds a stray top-level description into the first diagram (transitional data)', () => {
    const transitional = {
      description: 'shared intro',
      diagrams: [{ id: '11111111-1111-4111-8111-111111111111', name: 'D1', image: SAMPLE_IMAGE }],
    } as unknown as DataflowInfo;

    const result = migrateDataflowInfo(transitional);

    expect(result.diagrams?.[0].description).toBe('shared intro');
    expect((result as Record<string, unknown>).description).toBeUndefined();
  });
});

describe('dataflowInfoNeedsMigration - legacy 1.0 detection (US-1-T2)', () => {
  test('detects a legacy dataflow that carries an image', () => {
    expect(dataflowInfoNeedsMigration({ description: 'desc', image: SAMPLE_IMAGE })).toBe(true);
  });

  test('treats an empty legacy image key as needing migration (no silent alteration)', () => {
    expect(dataflowInfoNeedsMigration({ description: 'desc', image: '' })).toBe(true);
  });

  test('does not flag an already-1.1 dataflow with a diagrams array', () => {
    expect(dataflowInfoNeedsMigration({ diagrams: [] })).toBe(false);
  });

  test('flags a non-empty description-only legacy dataflow', () => {
    expect(dataflowInfoNeedsMigration({ description: 'desc' })).toBe(true);
  });

  test('does not flag the empty default dataflow', () => {
    expect(dataflowInfoNeedsMigration({ description: '' })).toBe(false);
  });

  test('does not flag an undefined dataflow', () => {
    expect(dataflowInfoNeedsMigration(undefined)).toBe(false);
  });
});

describe('dataExchangeNeedsMigration - ingestion consent gate (US-1-T7)', () => {
  test('flags a supported below-current schema (1.0)', () => {
    expect(dataExchangeNeedsMigration({ schema: 1.0 })).toBe(true);
  });

  test('does not flag an already-current schema (1.1)', () => {
    expect(dataExchangeNeedsMigration({ schema: 1.1 })).toBe(false);
  });

  test('does not flag an unsupported schema', () => {
    expect(dataExchangeNeedsMigration({ schema: 2.0 })).toBe(false);
  });

  test('does not flag the pre-schema list-only sentinel (-1)', () => {
    expect(dataExchangeNeedsMigration({ schema: -1 })).toBe(false);
  });

  test('does not flag input without a numeric schema', () => {
    expect(dataExchangeNeedsMigration({})).toBe(false);
  });
});
