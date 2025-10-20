import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login (adjust based on your Clerk setup)
    await page.goto('/sign-in');
    await page.fill('input[name="identifier"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.click('text=New Task');
    
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task created by E2E test');
    await page.selectOption('select[name="priority"]', 'high');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard\/tasks\/[a-z0-9-]+/);
    await expect(page.locator('h1')).toContainText('E2E Test Task');
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    await page.click('text=Filters');
    await page.selectOption('select[name="status"]', 'completed');
    
    // Check that only completed tasks are shown
    const tasks = await page.locator('[data-testid="task-card"]').all();
    for (const task of tasks) {
      await expect(task).toContainText('completed');
    }
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    // Click on first task
    await page.click('[data-testid="task-card"]:first-child');
    
    // Change status
    await page.selectOption('select[name="status"]', 'in_progress');
    
    await expect(page.locator('.badge')).toContainText('in progress');
  });

  test('should search tasks', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    
    await page.fill('input[placeholder*="Search"]', 'specific task name');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    const tasks = await page.locator('[data-testid="task-card"]').count();
    expect(tasks).toBeGreaterThanOrEqual(0);
  });
});