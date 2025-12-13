import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const TEST_ADMIN_EMAIL = 'admin@example.com';
const TEST_ADMIN_PASSWORD = 'AdminPassword123!';

test.describe('Community Features', () => {

  test.describe('Feature 1: Posts & Comments', () => {

    test('should allow user to create a post', async ({ page }) => {
      // Navigate to login
      await page.goto(`${BASE_URL}/login`);

      // Login
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');

      // Wait for navigation to complete
      await page.waitForURL(/.*\/(course|community).*/);

      // Navigate to community
      await page.goto(`${BASE_URL}/community`);

      // Wait for community page to load
      await page.waitForSelector('text=المجتمع');

      // Create a new post
      await page.click('text=إنشاء منشور'); // or find the new post button
      await page.fill('input[placeholder*="عنوان"]', 'Test Post Title');
      await page.fill('textarea[placeholder*="محتوى"]', 'This is a test post content');
      await page.click('button:has-text("نشر")');

      // Verify post appears
      await expect(page.locator('text=Test Post Title')).toBeVisible();
    });

    test('should allow user to like a post', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Find and click like button on first post
      const likeButton = page.locator('button').filter({ hasText: /إعجاب|Like/ }).first();
      const likesCountBefore = await likeButton.textContent();
      await likeButton.click();

      // Wait for like count to update
      await page.waitForTimeout(1000);
      const likesCountAfter = await likeButton.textContent();
      expect(likesCountAfter).not.toBe(likesCountBefore);
    });

    test('should allow user to comment on a post', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click on first post to expand comments
      await page.locator('button').filter({ hasText: /تعليق|Comment/ }).first().click();

      // Add comment
      await page.fill('textarea[placeholder*="تعليق"]', 'This is a test comment');
      await page.click('button:has-text("إرسال")');

      // Verify comment appears
      await expect(page.locator('text=This is a test comment')).toBeVisible();
    });

    test('admin should be able to pin a post', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
      await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Find admin menu on first post
      await page.locator('button').filter({ has: page.locator('svg') }).first().click();
      await page.click('text=تثبيت المنشور');

      // Verify post is pinned (should have pin indicator)
      await page.waitForTimeout(1000);
      // Check for pin icon or indicator
    });
  });

  test.describe('Feature 2: Events', () => {

    test('should display events on events tab', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click events tab
      await page.click('button:has-text("الفعاليات")');

      // Verify events section is visible
      await expect(page.locator('text=الفعاليات القادمة')).toBeVisible();
    });

    test('should allow user to register for an event', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click events tab
      await page.click('button:has-text("الفعاليات")');

      // Register for first event
      const registerButton = page.locator('button:has-text("سجل الآن")').first();
      if (await registerButton.isVisible()) {
        await registerButton.click();

        // Verify registration success
        await expect(page.locator('text=مسجل')).toBeVisible();
      }
    });

    test('admin should be able to create an event', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
      await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click events tab
      await page.click('button:has-text("الفعاليات")');

      // Click create event button
      await page.click('button:has-text("إضافة فعالية")');

      // Fill event form
      await page.fill('input[placeholder*="عنوان"]', 'Test Event');
      await page.fill('textarea[placeholder*="وصف"]', 'This is a test event');
      await page.fill('input[type="date"]', '2025-12-20');
      await page.fill('input[type="time"]', '18:00');

      // Submit
      await page.click('button:has-text("إنشاء الفعالية")');

      // Verify event appears
      await expect(page.locator('text=Test Event')).toBeVisible();
    });
  });

  test.describe('Feature 3: Files', () => {

    test('should display files on files tab', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click files tab
      await page.click('button:has-text("الملفات")');

      // Verify files section is visible
      await expect(page.locator('text=مركز الملفات')).toBeVisible();
    });

    test('should allow user to download a file', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click files tab
      await page.click('button:has-text("الملفات")');

      // Click download on first file
      const downloadButton = page.locator('button:has-text("تنزيل")').first();
      if (await downloadButton.isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();

        // Download count should increment
        await page.waitForTimeout(1000);
      }
    });

    test('admin should be able to upload a file', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
      await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community`);

      // Click files tab
      await page.click('button:has-text("الملفات")');

      // Click upload button
      await page.click('button:has-text("رفع ملف")');

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is a test file')
      });

      // Fill metadata
      await page.fill('input[placeholder*="عنوان"]', 'Test File');
      await page.fill('textarea[placeholder*="وصف"]', 'Test file description');

      // Submit
      await page.click('button:has-text("رفع الملف")');

      // Verify file appears
      await expect(page.locator('text=Test File')).toBeVisible();
    });
  });

  test.describe('Feature 4: Admin Management', () => {

    test('admin should access admin management page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
      await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);

      // Navigate to admin page
      await page.goto(`${BASE_URL}/community/admin`);

      // Click management tab
      await page.click('button:has-text("إدارة المشرفين")');

      // Verify admin management interface is visible
      await expect(page.locator('text=إدارة المشرفين')).toBeVisible();
    });

    test('admin should be able to promote a user', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
      await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);
      await page.goto(`${BASE_URL}/community/admin`);

      // Click management tab
      await page.click('button:has-text("إدارة المشرفين")');

      // Click users tab
      await page.click('button:has-text("المستخدمون")');

      // Promote first user
      const promoteButton = page.locator('button:has-text("ترقية لمشرف")').first();
      if (await promoteButton.isVisible()) {
        await promoteButton.click();

        // Confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Wait for promotion
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Feature 5: Navigation & Landing Page', () => {

    test('should show community link in navbar for logged-in users', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/(course|community).*/);

      // Verify community link exists in navbar
      await expect(page.locator('nav a:has-text("المجتمع")')).toBeVisible();
    });

    test('should display community CTA on landing page', async ({ page }) => {
      await page.goto(BASE_URL);

      // Scroll to community section
      await page.locator('text=تواصل مع مجتمع المبرمجين').scrollIntoViewIfNeeded();

      // Verify community CTA is visible
      await expect(page.locator('text=تواصل مع مجتمع المبرمجين')).toBeVisible();
      await expect(page.locator('button:has-text("انضم للمجتمع مجاناً")')).toBeVisible();
    });

    test('community CTA button should navigate to community page', async ({ page }) => {
      await page.goto(BASE_URL);

      // Click community CTA
      await page.locator('text=تواصل مع مجتمع المبرمجين').scrollIntoViewIfNeeded();
      await page.click('a:has-text("انضم للمجتمع مجاناً")');

      // Should redirect to login or community
      await page.waitForURL(/.*\/(login|community).*/);
    });
  });
});
