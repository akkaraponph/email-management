# Changelog

Notable changes to this project are recorded in this file.

## Unreleased

### Added

- Added the Apache License 2.0 and a copyright notice for Akkarapon Phikulsri.

### Changed

- Configured automatic Vercel Git deployments for the `main` branch only.

## 0.1.0

### Security

- Disabled database-backed template API handlers until authentication and owner authorization are available. The browser-local demo remains available.
- Isolated email previews in sandboxed frames with a restrictive content security policy, and removed unsafe print-window HTML rendering.
- Added browser and API security regression tests.

## Earlier changes

The following highlights are reconstructed from the project history; release dates and version boundaries have not been established.

### Added

- Added an email template editor with formatting tools, template variables, and export options.
- Added background, header, and footer editing, with preview support.
- Added Prisma-backed storage and a demo template store with in-memory storage and tests.
- Added a development guide to the README.

### Changed

- Upgraded Next.js and updated the application layout and navigation.
- Improved the full-space layout and unified the preview navigation bar.

### Fixed

- Fixed email preview and footer display issues.
- Fixed background saving, editor updates, and API errors.
