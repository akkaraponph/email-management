# Changelog

Notable changes to this project are recorded in this file.

## [0.1.0] - 2026-11-21

### Added

- Added GitHub Actions validation for pull requests and pushes to main.
- Added lint, type-check, test, and Prisma client generation scripts.
- Added the Apache License 2.0 and a copyright notice for Akkarapon Phikulsri.

### Changed

- Standardized installs on npm and documented PostgreSQL setup.
- Pinned Node 22 for development and CI and moved TypeScript scripts to tsx.
- Configured automatic Vercel Git deployments for the `main` branch only.

### Fixed

- Replaced the removed Next.js lint command and corrected setup prerequisites.
- Included Linux native dependencies needed by CI builds.

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

[0.1.0]: https://github.com/akkaraponph/email-management/releases/tag/v0.1.0
