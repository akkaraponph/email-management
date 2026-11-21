# Email template example guide

## Purpose

Email Management is an example workspace for editing email template HTML, configuring variables, previewing content and exporting results. The application entry point renders `EmailTemplateManager` from `src/app/page.tsx`.

## Start the editor

Install a Node.js version supported by the Next.js version in `package-lock.json`, then run `npm ci` and `npm run dev`. Open `http://localhost:3000` in a browser. The browser demo store initializes welcome email, order confirmation and password reset templates on first use.

## Work with a template

1. Select a template from the top bar, or choose **New Template** and provide a name.
2. Edit the content in the editor. Variables use placeholders such as `{{.firstName}}`; preview values can be adjusted in the variable controls.
3. Use the edit, split and preview views to inspect the content. **Full Preview** opens the dedicated preview flow.
4. Click **Save** to save the current content and preview data. The top-bar **Export** menu receives the selected template object, which may not reflect recent edits even after saving; check the exported file.
5. Choose an export option for the desired HTML or variable data. Custom templates can be deleted using the delete control. System templates cannot be deleted.

New custom templates start with `firstName`, `lastName` and `email` variables. The editor supports formatting and insertion controls, as well as background and header/footer settings.

## Data and API boundaries

`src/services/emailTemplateService.ts` uses `src/lib/demoTemplateStore.ts` for template, variable and preview-data operations. The store persists data in the current browser's local storage under `email-template-demo-store-v1`. Clearing browser data removes that local copy. Background and header/footer services also cache settings locally and attempt API requests; they return local settings when a request fails.

The separate handlers under `src/app/api/templates/` use Prisma. `prisma/schema.prisma` configures PostgreSQL through `DATABASE_URL`. To prepare a local database, copy `env-sample` to `.env`, set the connection string, then run `npx prisma generate` and `npx prisma migrate dev`. `npm run seed` adds example database records. These records are separate from the browser demo store.

## Source references

- `src/components/editor/EmailTemplateManager.tsx`: selection, creation, saving and deletion.
- `src/components/editor/EmailTemplateEditor.tsx`: editor, variable controls and preview.
- `src/components/editor/sections/export/ExportOptionsComponent.tsx`: export menu and handlers.
- `src/services/emailBackgroundService.ts` and `src/services/emailTemplateService.ts`: background and header/footer persistence.
- `src/lib/demoTemplateStore.ts`: initial examples and browser persistence.
- `prisma/schema.prisma` and `src/app/api/templates/`: database models and API handlers.
