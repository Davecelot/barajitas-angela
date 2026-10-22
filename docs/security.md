# Security configuration

Use Node 24.22.1 or a later patched release in the supported 24.x line. `.nvmrc`
pins the tested minimum and CI reads that file. Install dependencies with
`npm ci`; run `npm run security:check`, `npm run security:deps`, `npm test`,
`npm run validate:album-data`, and `npm run build` before publishing. Dependency
audits include build and development tooling as well as runtime dependencies.

## Authentication

The frontend is public. Never bundle account passwords, password hashes,
private API keys, signing keys, or database credentials. The former static
account file has been removed. Any credential reused from that publicly
committed file must be rotated at its actual authentication service; deleting
it from the current tree cannot remove public copies or Git history.

`VITE_API_URL` is a public, non-secret configuration URL. It must use HTTPS and
point to a trusted authentication service supporting:

- `POST /api/login`: JSON `{ username, password }`, response `{ token }`.
- `GET /api/me`: Bearer token, response `{ user: { id, name, role } }`; role is
  `admin` or `normal`. Invalid, revoked, and expired tokens must be rejected.

The token is validated by `/api/me` before the UI accepts a role, including on
reload. A forged legacy localStorage identity cannot grant edit controls.
Token changes and logout in another tab invalidate the current identity before
any replacement token is validated. Album storage changes do not affect login.
A separate logout revision also cancels older pending logins when there is no
token to remove; a new login started after logout remains valid.
Persisted token records carry that revision, so a token written concurrently
with a later logout cannot be restored as current by another tab.
Requests fail closed and do not follow redirects; absent configuration leaves
the album browse/export-only. Browser token storage requires the same XSS
protections as other browser session storage. A future backend may replace
this documented token contract with secure HttpOnly cookies, but this frontend
does not assume such a service already exists.

This repository contains no authentication server and no shared album-storage
API. Collection and repeated stickers remain in localStorage. They are not
confidential or protected against the browser owner changing them directly.
Any backend added later must enforce authorization on its own writes rather
than trusting client UI controls or client-supplied roles.

## Supply chain and reports

CI uses verified full commit SHAs for GitHub Actions. Deployment permissions
are limited to the deployment job. Dependency and source-security failures are
blocking; do not bypass them. Source and built-bundle diagnostics identify
files and rule names without echoing potential credential values.
