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
import { z } from 'zod';
import { BaseImageInfoSchema } from './entities';
import { SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH } from '../configs';

export const DataflowDiagramSchema = z.object({
  id: z.string().max(36).describe('UUID v4 identifier for the data-flow diagram'),
  name: z.string().min(1).max(SINGLE_FIELD_INPUT_SMALL_MAX_LENGTH).describe('Display name of the data-flow diagram'),
  image: BaseImageInfoSchema.shape.image.describe('Data-flow diagram image. ' + BaseImageInfoSchema.shape.image.description),
  description: BaseImageInfoSchema.shape.description.describe('Markdown introduction for this data-flow diagram. Start your headers from H3 maximum'),
}).strict();

export type DataflowDiagram = z.infer<typeof DataflowDiagramSchema>;

export const DataflowInfoSchema = z.object({
  diagrams: DataflowDiagramSchema.array().optional().describe('Ordered collection of named data-flow diagrams; array order is display order'),
}).strict();

export type DataflowInfo = z.infer<typeof DataflowInfoSchema>;