# Version 0.1.0

## Scope

This version provides the browser-local email template demo. Templates, variables and preview data in the main demo are stored in the browser. The PostgreSQL-backed template API is disabled: every implemented template handler returns HTTP 503 until authentication and owner authorization are implemented. Database-backed background and header/footer settings are consequently unavailable.

## Changes

- Render email previews in sandboxed, opaque-origin frames with scripts blocked and HTTPS images available only after an explicit opt-in.
- Remove the print path that wrote untrusted HTML into a new window.
- Show the initial editor content in the live preview.
- Add basic response security headers, Playwright regression tests and set the package version to 0.1.0.

## Verification

The production build passed with `npm run build`. Five Playwright tests passed against the local development server and installed Chrome, exercising the 16 disabled API handlers, sandboxed previews, hostile full-preview and header/footer markup, remote-image opt-in, and response headers. No database, authenticated API, deployed gateway, or production environment was tested.

## Known limitations

- The API is unavailable, including for legitimate callers. Authentication, ownership rules, system-template permissions and corresponding authorized and wrong-owner tests remain to be implemented.
- Sandboxed previews block remote images by default and remote fonts entirely. Opting in to HTTPS images contacts external hosts. Exported HTML is not sanitized.
- The release does not establish that a deployment is secure or that an incident occurred.

## Deployment and rollback

Deploy only where the API restriction and browser-local storage are acceptable. Verify the deployed revision, demo editing and preview, and the API's 503 response without using production data. Roll back the application to a previously deployed revision if needed; an older revision may re-expose the unprotected API, so restrict its access before rollback. This change adds no database migration.
