# Email Management roadmap

This proposed roadmap organizes the next steps for the email template example into four workstreams. The sequence is based on the current repository and the partial security assessment. It does not assign dates, owners, or release commitments.

## 1. Release Foundation

**Goal:** Make a release reproducible and give maintainers a clear decision point before deployment.

- [ ] Define the intended release boundary: browser-local demo, database-backed API, and the environments in which each is intended to run. Document how data is stored and which behavior is supported.
- [ ] Establish a repeatable build and release check using the project scripts, a supported Node.js version, and the lockfile. Resolve any failures found during validation.
- [ ] Define a versioning and changelog process, including how a release is identified and how a maintainer can roll back an application deployment and assess database migration impacts.
- [ ] Document how the static project page is published separately from the server-rendered application.

**Completion evidence:** A maintainer can follow the documented release checklist from a clean checkout, record the results, and identify the deployed revision and rollback procedure. The selected release scope determines which security and integration checks must pass.

**Baseline:** [`package.json`](../package.json) defines development, build and start scripts; [`CHANGELOG.md`](../CHANGELOG.md) has an Unreleased section; [`vercel.json`](../vercel.json) enables Git deployments for `main`. The editor template service uses browser storage, while API routes use Prisma ([service](../src/services/emailTemplateService.ts), [API](../src/app/api/templates/route.ts)). The repository configuration alone does not establish deployment state.

## 2. Security Baseline

**Goal:** Address the access and preview-rendering risks identified in the existing assessment before exposing database-backed functionality to untrusted users.

- [ ] Define the access model for the database-backed API. Restrict exposure until appropriate controls are in place; implement authentication, server-side ownership checks and explicit system-template permissions for all applicable routes.
- [ ] Review every HTML preview and interpolation path. Apply a suitable sanitization or isolation strategy, handle variable values for their HTML context, and validate URL schemes.
- [ ] Validate API inputs and set appropriate request limits. Review dependencies and establish a repeatable security scanning process.
- [ ] Add regression checks for anonymous, wrong-owner and authorized API requests, plus hostile markup and variable values in preview paths.

**Completion evidence:** Tests demonstrate the chosen access rules across collection and nested routes, and preview checks cover the editor, full preview and header/footer paths. Record the scope and results of a follow-up security assessment.

**Baseline:** A partial static security assessment reports missing application-level authentication and ownership checks in representative [template API handlers](../src/app/api/templates/route.ts) and unsafe [preview interpolation](../src/components/pages/email-preview/EmailPreview.tsx). These findings were not dynamically tested, and deployment exposure and external controls were not established.

## 3. Reliability & Testing

**Goal:** Make the main editing and export workflows dependable and verifiable.

- [ ] Fix and test the top-bar export data flow so exported content reflects the intended current editor state, including after a save and template change.
- [ ] Add automated tests for demo-store creation, updates, deletion rules and persistence; cover important failures and malformed stored data.
- [ ] Add integration coverage for API and database behavior, including validation and error responses, where the database-backed API is in the release scope.
- [ ] Exercise the core user journey: select or create a template, edit it, configure variables, preview, save, reload and export. Include relevant background and header/footer settings.
- [ ] Establish runnable lint, type-check, test and build commands, and run the applicable checks in continuous integration.

**Completion evidence:** The documented checks run from a clean setup and cover the main workflows and regression cases. A failing check blocks the release process defined above.

**Baseline:** [`demoTemplateStore.test.ts`](../src/lib/demoTemplateStore.test.ts) checks initial demo templates. [`package.json`](../package.json) defines a lint script but no test script. The [template manager](../src/components/editor/EmailTemplateManager.tsx) passes the selected template's content to the top-bar export while edits are held separately, so the export path requires verification and correction.

## 4. Contributor Experience

**Goal:** Help contributors set up the project and make changes with confidence.

- [ ] Verify the README setup from a clean checkout and document the supported Node.js version, database prerequisites, available checks and common setup failures.
- [ ] Add contribution guidance covering the development workflow, pull request expectations and how to run the release checks.
- [ ] Explain the browser demo store and the separate PostgreSQL API, including when a contributor needs a database and how local data can be reset safely.
- [ ] Document a security reporting contact or process once the maintainer chooses one.

**Completion evidence:** A contributor can follow the setup and contribution instructions to run the relevant checks and submit a change. The instructions match the scripts and supported workflow.

**Baseline:** The [README](../README.md) describes local setup and the storage distinction. The repository provides [`env-sample`](../env-sample), Prisma migrations and a seed script.

## Suggested order

1. Agree on the release boundary and restrict API exposure where necessary. Establish a working local verification baseline.
2. Address the security findings and export consistency, adding regression tests as behavior changes.
3. Automate the checks, complete release and rollback instructions, and verify the contributor workflow from a clean checkout.

Contributor documentation and test infrastructure can progress alongside the security work. Public release of database-backed functionality depends on the selected access model and its verification.
