# Email Management

An email template editor example built with Next.js, React, TipTap, Ant Design and Prisma. It provides a browser-based workspace for editing HTML, using variables, previewing content and exporting templates.

## Run locally

Install a Node.js version supported by the Next.js version in `package-lock.json`, then run:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The editor's template service stores its demo templates, variables and preview data in browser local storage. The first visit creates three system examples: welcome email, order confirmation and password reset. Custom templates can be created and deleted; system templates cannot be deleted. Browser storage is local to that browser and can be cleared by the user.

Select a template or choose **New Template**, edit its content and click **Save**. Use the variable controls and preview modes to inspect the result. The **Export** menu offers HTML and variable data options. The top-bar export receives the selected template object, which may not reflect recent edits even after saving; check the exported file.

## PostgreSQL-backed API

The repository also contains Prisma-backed API routes. In version 0.1.0, all template API handlers return HTTP 503 because the demo has no authentication or ownership checks. Do not expose the database-backed API until both are implemented and tested. The browser-local template demo remains available without a database.

To work on the database schema locally, create a PostgreSQL database and configure `DATABASE_URL` in `.env`:

```sh
cp env-sample .env
# Set DATABASE_URL in .env to your PostgreSQL connection string.
npx prisma generate
npx prisma migrate dev
```

`npm run seed` inserts example records into the database. The editor's template service uses browser storage independently of those database records. Background and header/footer settings attempt to call the disabled API, so database-backed reads and saves are unavailable. See [the Prisma schema](prisma/schema.prisma) and [API routes](src/app/api/templates).

## Security and tests

Email previews use opaque-origin sandboxed frames with scripts blocked. Remote images are blocked by default; use “Load remote images” to allow HTTPS images for that preview. Loading them contacts external hosts and may reveal your IP address. Remote fonts remain blocked. Downloaded HTML is not sanitized and should be treated as untrusted content.

Run `npm run build` to check the production build. Run `npm run test:e2e` after installing a Playwright Chromium browser (`npx playwright install chromium`). To use a locally installed Chromium executable instead, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its path. The tests cover the disabled API handlers, the demo editor and preview isolation; they do not verify authenticated database access.

## Project files

- `src/app/page.tsx`: editor entry point.
- `src/components/editor/`: template manager, editor and editing controls.
- `src/lib/demoTemplateStore.ts`: browser demo data and persistence.
- `src/app/api/templates/`: Prisma-backed template routes.
- `prisma/`: schema, migrations and database seed.
- `docs/`: static GitHub Pages landing page.

## Documentation

- [Email template guide](docs/email-template-guide.md)
- [Project roadmap](docs/roadmap.md)

## GitHub Pages

The static project page lives in `docs/`. To publish it, push these files to your repository, open **Settings → Pages**, choose **Deploy from a branch**, and select your branch and `/docs` as the source. The page describes the project; the Next.js application itself requires a server runtime and is not deployed by this static page.

## License

[Apache License 2.0](LICENSE).
