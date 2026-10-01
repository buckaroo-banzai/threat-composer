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
import { MAX_TMT_DIAGRAM_IMAGE_BYTES, MAX_TMT_REPORT_CHARS } from '../../../configs';
import { TmtDrawingSurface } from '../tmtModel';

// A DFD diagram image extracted from a TMT Full Report, matched to a parsed '.tm7' drawing surface.
export interface TmtReportDiagram {
  surfaceGuid: string;
  name: string;
  image: string; // full 'data:image/png;base64,...' URL
}

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';
const DIAGRAM_HEADING_PREFIX = 'Diagram:';

// Allow-list the base64 payload (standard alphabet + optional padding, non-empty). getAttribute decodes
// HTML entities, so a prefix-only check would let a crafted src smuggle quotes/markup after the prefix.
const VALID_BASE64_PAYLOAD_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

const decodedBase64Bytes = (base64: string): number => {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

// Walk the report in document order, pairing each 'Diagram: <name>' heading with the image that follows
// it. Per-threat 'Interaction' screenshots live under <h3> and never follow a diagram heading, so they
// are ignored. A non-diagram <h2> clears any pending heading so a later image can't be mispaired.
const extractDiagramNodes = (doc: Document): { name: string; src: string }[] => {
  const diagrams: { name: string; src: string }[] = [];
  let pendingName: string | undefined;
  for (const el of Array.from(doc.querySelectorAll('h2, img'))) {
    if (el.tagName.toLowerCase() === 'h2') {
      const text = (el.textContent ?? '').trim();
      pendingName = text.startsWith(DIAGRAM_HEADING_PREFIX) ? text.slice(DIAGRAM_HEADING_PREFIX.length).trim() : undefined;
    } else if (pendingName !== undefined) {
      diagrams.push({ name: pendingName, src: el.getAttribute('src') ?? '' });
      pendingName = undefined;
    }
  }
  return diagrams;
};

/**
 * Extracts each DFD diagram image and name from a Microsoft TMT Full Report (HTML) and matches them, by
 * document order with the name as a cross-check, to the non-empty drawing surfaces of the parsed '.tm7'
 * model (the report omits empty surfaces). Every failure is blocking: a count or name mismatch, a
 * non-PNG or external image, an oversized image, or oversized input throws rather than guess a mapping.
 *
 * Uses 'DOMParser' with 'text/html', which parses without executing scripts or fetching resources.
 * Runs in the browser at import time; unit tests provide 'DOMParser' via a jsdom test environment.
 */
export const extractTmtReportDiagrams = (
  html: string,
  surfaces: TmtDrawingSurface[],
  options: { maxChars?: number; maxImageBytes?: number } = {},
): TmtReportDiagram[] => {
  const maxChars = options.maxChars ?? MAX_TMT_REPORT_CHARS;
  const maxImageBytes = options.maxImageBytes ?? MAX_TMT_DIAGRAM_IMAGE_BYTES;

  if (typeof html !== 'string' || html.trim().length === 0) {
    throw new Error('Empty Full Report HTML input');
  }
  if (html.length > maxChars) {
    throw new Error('Full Report HTML exceeds the maximum allowed size');
  }

  const expected = surfaces.filter((surface) => !surface.isEmpty);

  const found = extractDiagramNodes(new DOMParser().parseFromString(html, 'text/html'));

  if (found.length !== expected.length) {
    throw new Error(
      `The Full Report has ${found.length} diagram image(s) but the model has ${expected.length} non-empty drawing surface(s); refusing to guess the mapping`,
    );
  }

  return expected.map((surface, index) => {
    const diagram = found[index];
    if (diagram.name !== surface.name) {
      throw new Error(
        `Full Report diagram at position ${index + 1} is named "${diagram.name}", but the model surface at that position is named "${surface.name}"`,
      );
    }
    if (!diagram.src.startsWith(PNG_DATA_URL_PREFIX)) {
      throw new Error(`Full Report diagram "${surface.name}" does not have an embedded PNG image`);
    }
    const base64 = diagram.src.slice(PNG_DATA_URL_PREFIX.length);
    if (!VALID_BASE64_PAYLOAD_PATTERN.test(base64)) {
      throw new Error(`Full Report diagram "${surface.name}" has a malformed or non-base64 image payload`);
    }
    const bytes = decodedBase64Bytes(base64);
    if (bytes > maxImageBytes) {
      throw new Error(
        `Full Report diagram "${surface.name}" image is ${bytes} bytes, exceeding the ${maxImageBytes}-byte limit`,
      );
    }
    return { surfaceGuid: surface.guid, name: surface.name, image: diagram.src };
  });
};
