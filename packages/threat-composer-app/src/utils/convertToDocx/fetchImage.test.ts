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
import fetchImage from './fetchImage';

describe('fetchImage', () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalImage = (global as any).Image;

  afterEach(() => {
    global.fetch = originalFetch;
    global.URL.createObjectURL = originalCreateObjectURL;
    (global as any).Image = originalImage;
  });

  it('requests images with redirect: "error" so a public->internal redirect cannot be followed', async () => {
    const fetchMock = jest.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
      headers: { get: () => 'image/png' },
    }));
    global.fetch = fetchMock as any;
    global.URL.createObjectURL = (() => 'blob:mock') as any;
    // Minimal Image stub that fires onload as soon as src is set, so fetchImage can resolve.
    (global as any).Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 100;
      naturalHeight = 50;
      set src(_value: string) {
        setTimeout(() => this.onload && this.onload(), 0);
      }
    };

    await fetchImage('https://example.com/diagram.png');

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/diagram.png', { redirect: 'error' });
  });
});
