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

// Selects the Jest test environment per file: test files whose path matches a JSDOM pattern run in
// jsdom (they need a browser DOM, e.g. DOMParser); every other test runs in the faster Node
// environment, which is this package's default. This avoids making the whole package jsdom.

// Jest environment packages differ in export shape across versions (module.exports vs .default);
// normalize to the constructor either way.
const asEnvironmentClass = (mod) => mod.default || mod;
const NodeEnvironment = asEnvironmentClass(require('jest-environment-node'));
const JsdomEnvironment = asEnvironmentClass(require('jest-environment-jsdom'));

const JSDOM_TEST_PATTERNS = [/extractTmtReportDiagrams/, /importTmtModel/];
// jsdom's crypto (unlike Node and real browsers) does not implement randomUUID; add it so code that
// relies on it can be exercised in jsdom without changing production behavior.
const { randomUUID } = require('crypto');

class JsdomTestEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();
    const cryptoObj = this.global.crypto;
    if (cryptoObj && typeof cryptoObj.randomUUID !== 'function') {
      cryptoObj.randomUUID = () => randomUUID();
    }
  }
}
class SelectiveTestEnvironment {
  constructor(config, context) {
    const usesDom = JSDOM_TEST_PATTERNS.some((pattern) => pattern.test(context.testPath));
    const Environment = usesDom ? JsdomTestEnvironment : NodeEnvironment;
    // A constructor may return a different object; Jest then uses that concrete environment instance.
    return new Environment(config, context);
  }
}

module.exports = SelectiveTestEnvironment;
