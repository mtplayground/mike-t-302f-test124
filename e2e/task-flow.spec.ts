import { expect, test } from '@playwright/test';

test('task smoke flow', async ({ page }) => {
  const title = `E2E task ${Date.now()}`;
  const editedTitle = `${title} edited`;

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

  await page.getByLabel('Task title').fill(title);
  await page.getByRole('button', { name: 'Add task' }).click();

  await expect(page.getByRole('button', { name: title })).toBeVisible();

  await page.getByRole('button', { name: title }).click();
  const titleEditor = page.getByLabel(`Edit title for "${title}"`);
  await titleEditor.fill(editedTitle);
  await titleEditor.press('Enter');

  await expect(page.getByRole('button', { name: editedTitle })).toBeVisible();

  const dueDate = page.getByLabel(`Due date for "${editedTitle}"`, { exact: true });
  const dueDateResponse = page.waitForResponse(
    (response) => response.url().includes('/api/tasks/') && response.request().method() === 'PATCH',
  );
  await dueDate.fill('2026-06-30');
  await dueDateResponse;
  await expect(dueDate).toHaveValue('2026-06-30');

  const completeCheckbox = page.getByRole('checkbox', {
    name: `Mark "${editedTitle}" as completed`,
  });
  const completionResponse = page.waitForResponse(
    (response) => response.url().includes('/api/tasks/') && response.request().method() === 'PATCH',
  );
  await completeCheckbox.click();
  await completionResponse;
  await expect(
    page.getByRole('checkbox', {
      name: `Mark "${editedTitle}" as active`,
    }),
  ).toBeChecked();

  const taskRow = page.getByRole('listitem').filter({
    has: page.getByRole('button', { name: editedTitle }),
  });
  await taskRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('status')).toContainText(`Deleted "${editedTitle}".`);
  await expect(page.getByRole('button', { name: editedTitle })).toHaveCount(0);

  await page.waitForTimeout(5_500);
  await page.reload();

  await expect(page.getByRole('button', { name: editedTitle })).toHaveCount(0);
});
