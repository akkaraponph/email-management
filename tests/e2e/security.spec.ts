import { test, expect } from '@playwright/test';

const endpoints: [string, string[]][] = [
  ['/api/templates', ['GET', 'POST']],
  ['/api/templates/other-owner', ['GET', 'PUT', 'DELETE']],
  ['/api/templates/other-owner/preview', ['GET', 'PUT']],
  ['/api/templates/other-owner/variables', ['GET', 'POST']],
  ['/api/templates/other-owner/variables/other-variable', ['GET', 'PUT', 'DELETE']],
  ['/api/templates/other-owner/header-footer', ['GET', 'PUT']],
  ['/api/templates/other-owner/background', ['GET', 'PUT']],
];

test('all database template handlers fail closed, including forged ownership', async ({ request }) => {
  for (const [path, methods] of endpoints) {
    for (const method of methods) {
      const response = await request.fetch(path, {
        method,
        ...(method === 'GET' ? {} : { data: { userId: 'another-user', name: 'forged' } }),
      });
      expect(response.status(), `${method} ${path}`).toBe(503);
      expect(response.headers()['cache-control']).toBe('no-store');
    }
  }
});

test('demo editor renders its live preview inside a scriptless sandbox', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Split Live', { exact: false }).click({ timeout: 30_000 });
  const frame = page.locator('iframe[title="Live email preview"]');
  await expect(frame).toHaveAttribute('sandbox', '');
  await expect(page.frameLocator('iframe[title="Live email preview"]').locator('body')).toContainText('Welcome');
  await page.getByText('Background & Layout', { exact: false }).click();
  await expect(page.locator('iframe[title="Background email preview"]')).toHaveAttribute('sandbox', '');
});

test('full preview isolates hostile markup and retains benign formatting', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('preview-template-id', 'default-template');
    localStorage.setItem('preview-template-name', 'Security fixture');
    localStorage.setItem('preview-template-html', `<p><strong>Safe formatting</strong> {{.name}}</p><script>window.securityFailure = true; parent.securityFailure = true</script><img src="missing" onerror="parent.securityFailure = true"><a href="javascript:parent.securityFailure=true">bad link</a>`);
    localStorage.setItem('preview-template-data', JSON.stringify({ name: '<svg onload="parent.securityFailure = true"></svg> Reader' }));
    localStorage.setItem('email-header-footer-default-template', JSON.stringify({
      headerEnabled: true, headerContent: '<strong>Header</strong><img src="x" onerror="parent.securityFailure=true">',
      footerEnabled: true, footerContent: '<em>Footer</em><svg onload="parent.securityFailure=true"></svg>',
    }));
  });
  await page.goto('/email-preview');
  const preview = page.locator('iframe[title="Full email preview"]');
  await expect(preview).toHaveAttribute('sandbox', '');
  const frame = page.frameLocator('iframe[title="Full email preview"]');
  await expect(frame.locator('strong').filter({ hasText: 'Safe formatting' })).toBeVisible();
  await expect(frame.locator('body')).toContainText('Reader');
  await expect(frame.locator('body')).toContainText('Header');
  await expect(frame.locator('body')).toContainText('Footer');
  expect(await frame.locator('body').evaluate(() => (window as unknown as { securityFailure?: boolean }).securityFailure)).toBeUndefined();
  await frame.getByText('bad link').click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { securityFailure?: boolean }).securityFailure)).toBeUndefined();
});

test('remote images require opt-in and retain the scriptless sandbox', async ({ page }) => {
  let imageRequests = 0;
  await page.route('https://images.example.test/logo.png', async route => {
    imageRequests++;
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' });
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('preview-template-id', 'default-template');
    localStorage.setItem('preview-template-html', '<img alt="remote logo" src="https://images.example.test/logo.png">');
    localStorage.setItem('preview-template-data', '{}');
  });
  await page.goto('/email-preview');
  const preview = page.locator('iframe[title="Full email preview"]');
  await expect(preview).toHaveAttribute('sandbox', '');
  await expect(page.frameLocator('iframe[title="Full email preview"]').locator('img')).toHaveCount(1);
  expect(imageRequests).toBe(0);
  await page.getByRole('button', { name: 'Load remote images (contacts external hosts)' }).click();
  await expect.poll(() => imageRequests).toBe(1);
  await expect(preview).toHaveAttribute('sandbox', '');
});

test('responses include basic security headers', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});
