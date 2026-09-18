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

// SSRF guard for the docx export image fetch. An imported (untrusted) model can point a diagram
// image, an Architecture image, or a Markdown-embedded image at an internal address; on export we
// would otherwise fetch it. isImageUrlSafeToFetch parses the URL first (canonicalizing percent-
// encoding, case, IDNA/punycode, and IP-literal forms) and only then checks the canonical scheme
// and host, so escaped or alternate encodings cannot slip a blocked host past a raw-string match.
// It allows data: URIs and public http(s) hosts, and denies the SDL "Sensitive IP Ranges"
// (Microsoft.Security.SystemsADM.10107): loopback, RFC1918 private, CGNAT, 169.254 link-local
// (incl. IMDS), Azure WireServer (168.63.129.16), 25.0.0.0/8, and the IPv6 equivalents (::/96,
// fc00::/7 ULA, fe80::/10 link-local, fec0::/10 site-local, plus IPv4-mapped forms), and localhost.
// The requirement also mandates validating the DNS-RESOLVED IP; a browser cannot resolve DNS, so
// DNS rebinding is an accepted residual that would need a server-side proxy. Redirect-based SSRF is
// handled separately in fetchImage via redirect: 'error'.

const isPrivateIpv4 = (host: string): boolean => {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }
  const octets = match.slice(1, 5).map(Number);
  if (octets.some((octet) => octet > 255)) {
    return true; // malformed dotted-quad: treat as unsafe
  }
  const [a, b, c, d] = octets;
  if (a === 0) return true; // 0.0.0.0/8 unspecified
  if (a === 10) return true; // 10/8 RFC1918 private
  if (a === 25) return true; // 25.0.0.0/8 (SDL Sensitive IP Ranges deny-list)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 CGNAT shared space
  if (a === 127) return true; // 127/8 loopback
  if (a === 168 && b === 63 && c === 129 && d === 16) return true; // 168.63.129.16 Azure WireServer
  if (a === 169 && b === 254) return true; // 169.254/16 link-local incl. cloud metadata (IMDS)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12 RFC1918 private
  if (a === 192 && b === 168) return true; // 192.168/16 RFC1918 private
  return false;
};

// Extract the embedded IPv4 from an IPv4-mapped IPv6 host, handling both the dotted
// (::ffff:127.0.0.1) and hextet (::ffff:7f00:1) forms. Returns null when not mapped.
const mappedIpv4 = (host: string): string | null => {
  const dotted = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) {
    return dotted[1];
  }
  const hextets = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hextets) {
    const high = parseInt(hextets[1], 16);
    const low = parseInt(hextets[2], 16);
    return [Math.floor(high / 256), high % 256, Math.floor(low / 256), low % 256].join('.');
  }
  return null;
};

const isBlockedHost = (hostname: string): boolean => {
  // Normalize the (already URL-parsed, hence canonical) host: lowercase, drop IPv6 brackets and a
  // trailing FQDN dot so 'localhost.' / '127.0.0.1.' cannot slip past the equality/range checks.
  const host = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '').replace(/\.$/, '');
  if (host === '' || host === 'localhost' || host.endsWith('.localhost')) {
    return true;
  }
  if (host.includes(':')) { // IPv6 literal
    // IPv4-mapped IPv6 (::ffff:x.x.x.x / ::ffff:hhhh:hhhh): decide by the embedded IPv4 so a mapped
    // PUBLIC address is not over-blocked (the Sensitive IP Ranges table does not deny ::ffff:0:0/96).
    const embedded = mappedIpv4(host);
    if (embedded) {
      return isPrivateIpv4(embedded);
    }
    // ::/96 — unspecified (::), loopback (::1), and deprecated IPv4-compatible (e.g. ::7f00:1).
    // Any non-mapped address with zero top 96 bits serializes starting with '::'.
    if (host.startsWith('::')) {
      return true;
    }
    // Unique-local fc00::/7 (fc../fd..), link-local fe80::/10, and deprecated site-local fec0::/10
    // (together fe80..feff). None are globally routable.
    if (host.startsWith('fc') || host.startsWith('fd') || /^fe[89abcdef]/.test(host)) {
      return true;
    }
    return false;
  }
  if (isPrivateIpv4(host)) {
    return true;
  }
  // Bare integer/hex host, e.g. 2130706433 or 0x7f000001. new URL() already canonicalizes most of
  // these to dotted IPv4 (caught above); reject any that remain as defense-in-depth.
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/.test(host)) {
    return true;
  }
  return false;
};

/**
 * Validates whether an image URL is safe to fetch during export. Enforces an allowed scheme
 * (data:, http:, https:) and — as an SSRF guard — a host that is not loopback, private (RFC1918),
 * CGNAT, link-local (incl. the 169.254.169.254 cloud-metadata address), or localhost. The URL is
 * parsed (canonicalized) before any host comparison. Additional rules can be added here as needed.
 */
export const isImageUrlSafeToFetch = (url: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === 'data:') {
    return true;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }
  return !isBlockedHost(parsed.hostname);
};
