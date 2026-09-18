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
import { isImageUrlSafeToFetch } from './isImageUrlSafeToFetch';

describe('isImageUrlSafeToFetch', () => {
  it.each([
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/svg+xml,<svg></svg>',
    'https://example.com/diagram.png',
    'http://example.com/diagram.png',
    'https://cdn.example.co.uk/a/b/c.jpg?x=1',
    'https://93.184.216.34/image.png', // public IP literal
    'https://172.15.0.1/x.png', // just below RFC1918 172.16/12
    'https://172.32.0.1/x.png', // just above RFC1918 172.16/12
    'https://fcbarcelona.com/x.png', // public domain starting 'fc' must not be over-blocked
    'https://fdplayers.org/x.png', // public domain starting 'fd' must not be over-blocked
    'http://[2606:4700:4700::1111]/x.png', // public IPv6 (Cloudflare) must be allowed
    'http://[::ffff:5db8:d822]/x.png', // IPv4-mapped IPv6 of a PUBLIC address (93.184.216.34)
  ])('allows public and data: URL: %s', (url) => {
    expect(isImageUrlSafeToFetch(url)).toBe(true);
  });

  it.each([
    'http://localhost/x.png',
    'http://localhost:3000/x.png',
    'http://sub.localhost/x.png',
    'http://127.0.0.1/x.png',
    'http://127.9.9.9/x.png',
    'http://0.0.0.0/x.png',
    'http://10.0.0.5/x.png',
    'http://172.16.0.1/x.png',
    'http://172.31.255.255/x.png',
    'http://192.168.1.1/x.png',
    'http://169.254.169.254/latest/meta-data/', // cloud metadata endpoint
    'https://100.64.0.1/x.png', // CGNAT shared space
    'http://[::1]/x.png', // IPv6 loopback
    'http://[fc00::1]/x.png', // IPv6 unique-local
    'http://[fd12:3456:789a::1]/x.png', // IPv6 unique-local
    'http://[fe80::1]/x.png', // IPv6 link-local
    'http://[::ffff:127.0.0.1]/x.png', // IPv4-mapped IPv6 (dotted)
    'http://[::ffff:7f00:1]/x.png', // IPv4-mapped IPv6 (hextet form) = 127.0.0.1
    'http://[::7f00:1]/x.png', // deprecated IPv4-compatible IPv6 (::/96) = 127.0.0.1
    'http://[fec0::1]/x.png', // deprecated IPv6 site-local (fec0::/10)
    'http://168.63.129.16/x.png', // Azure WireServer
    'http://25.10.20.30/x.png', // 25.0.0.0/8 deny-list range
    'http://127.0.0.1./x.png', // trailing-dot FQDN form of loopback
    'http://localhost./x.png', // trailing-dot localhost
    'http://2130706433/x.png', // decimal-integer encoding of 127.0.0.1
    'http://0x7f000001/x.png', // hex encoding of 127.0.0.1
  ])('blocks local/private/link-local host: %s', (url) => {
    expect(isImageUrlSafeToFetch(url)).toBe(false);
  });

  it.each([
    'ftp://example.com/x.png', // non-http(s) scheme
    'file:///etc/passwd',
    'javascript:alert(1)',
    'not a url',
    '',
  ])('blocks unsupported scheme or unparseable input: %s', (url) => {
    expect(isImageUrlSafeToFetch(url)).toBe(false);
  });
});
