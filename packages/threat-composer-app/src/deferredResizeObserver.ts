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

// Aliased in place of '@juggle/resize-observer' via craco. Cloudscape observes layout through this
// ponyfill; deferring each callback to the next animation frame stops the benign "ResizeObserver loop
// completed with undelivered notifications" its scheduler emits when a callback (e.g. the Select
// dropdown's fixStretching) re-lays-out within one delivery cycle. One-frame deferral only.
import {
  ResizeObserver as JuggleResizeObserver,
  ResizeObserverEntry,
  ResizeObserverSize,
} from '@juggle/resize-observer/lib/exports/resize-observer';

type JuggleResizeObserverCallback = ConstructorParameters<typeof JuggleResizeObserver>[0];

class DeferredResizeObserver extends JuggleResizeObserver {
  constructor(callback: JuggleResizeObserverCallback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => callback(entries, observer));
    });
  }
}

export { ResizeObserverEntry, ResizeObserverSize };
export { DeferredResizeObserver as ResizeObserver };
