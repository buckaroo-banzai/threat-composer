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
export const DEFAULT_WORKSPACE_ID = 'default';
export const DEFAULT_WORKSPACE_LABEL = 'Default';
export const DEFAULT_NEW_ENTITY_ID = 'new';

// The data exchange schema version this build reads and writes.
export const CURRENT_SCHEMA_VERSION = 1.1;

export const EXAMPLES_WORKSPACE_ID_PREFIX = 'EXAMPLE_';
export const EXAMPLES_SECTION_WORKSPACE_LABEL = 'Examples';

// Tags
export const SINGLE_FIELD_INPUT_TAG_MAX_LENGTH = 30;
// Metadata key, Workspace name
export const SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH = 50;
// Threat statement elements, Application name, custom template length
export const SINGLE_FIELD_INPUT_MAX_LENGTH = 200;
// Entity comments, Assumption/Mitigation content
export const FREE_TEXT_INPUT_SMALL_MAX_LENGTH = 1000;
// Application info, Architecture description, Dataflow description
export const FREE_TEXT_INPUT_MAX_LENGTH = 100000;
// Architecture diagram, data flow diagram
export const IMAGE_BASE64_MAX_LENGTH = 1000000;
//  Architecture diagram url, data flow diagram, url
export const IMAGE_URL_MAX_LENGTH = 2048;

// Microsoft TMT import: upper bounds on untrusted input.
// TODO: set these from real-world file sizes (see the import size-limit follow-up in the plan).
export const MAX_TMT_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_TM7_CHARS = 50 * 1024 * 1024;
export const MAX_TMT_REPORT_CHARS = 50_000_000;
export const MAX_TMT_DIAGRAM_IMAGE_BYTES = 10_000_000;

export const STORAGE_LOCAL_STORAGE = 'LocalStorage';
export const STORAGE_LOCAL_STATE = 'LocalState';

export const ALL_LEVELS = 'All';
export const LEVEL_NOT_SET = '-';
export const LEVEL_HIGH = 'High';
export const LEVEL_MEDIUM = 'Medium';
export const LEVEL_LOW = 'Low';