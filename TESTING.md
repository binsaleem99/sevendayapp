# Community Features Testing Guide

This guide explains how to test the community features implementation.

## Prerequisites

1. **Dev Server Running**: Ensure the dev server is running on `http://localhost:3001`
   ```bash
   npm run dev
   ```

2. **Database Migrations**: Run all community database migrations on Supabase
   - `20240101_complete_posts.sql`
   - `20240102_complete_events.sql`
   - `20240103_complete_files.sql`

3. **Supabase Storage**: Create the `community-files` storage bucket
   - Navigate to Supabase Dashboard → Storage
   - Create new bucket: `community-files`
   - Set as Public
   - File size limit: 50MB
   - Allowed MIME types: `application/*`, `image/*`, `text/*`

4. **Test Accounts**: Create test accounts in Supabase
   - Regular user: `test@example.com` / `TestPassword123!`
   - Admin user: `admin@example.com` / `AdminPassword123!`
   - Set admin user's `is_community_admin` to `true` in the profiles table

## Running Playwright Tests

### Option 1: Run All Tests
```bash
npm test
```

### Option 2: Run Community Tests Only
```bash
npm run test:community
```

### Option 3: Run with UI Mode (Recommended for debugging)
```bash
npm run test:ui
```

## Manual Testing Checklist

### Feature 1: Posts & Comments ✓

#### As Regular User:
- [ ] Navigate to `/community`
- [ ] Click "Posts" tab (should be active by default)
- [ ] Create a new post
  - [ ] Fill in title and content
  - [ ] Click "نشر" (Publish)
  - [ ] Verify post appears in feed
- [ ] Like a post
  - [ ] Click heart icon
  - [ ] Verify count increments
  - [ ] Click again to unlike
- [ ] Comment on a post
  - [ ] Click "تعليق" button
  - [ ] Enter comment text
  - [ ] Click "إرسال"
  - [ ] Verify comment appears
- [ ] Like a comment
  - [ ] Click heart icon on comment
  - [ ] Verify count updates

#### As Admin:
- [ ] View admin menu on posts (three-dot menu)
- [ ] Pin a post
  - [ ] Click admin menu
  - [ ] Click "تثبيت المنشور"
  - [ ] Verify post moves to top with pin indicator
- [ ] Delete a post
  - [ ] Click admin menu
  - [ ] Click "حذف المنشور"
  - [ ] Confirm deletion
  - [ ] Verify post is removed

### Feature 2: Events ✓

#### As Regular User:
- [ ] Click "الفعاليات" (Events) tab
- [ ] View upcoming events list
- [ ] Register for an event
  - [ ] Click "سجل الآن"
  - [ ] Verify button changes to "مسجل" (Registered)
  - [ ] Verify attendees count increments
- [ ] Unregister from an event
  - [ ] Click "إلغاء التسجيل"
  - [ ] Verify registration is cancelled
- [ ] View event details
  - [ ] Date and time
  - [ ] Online/In-person indicator
  - [ ] Attendees count
  - [ ] Capacity (if set)

#### As Admin:
- [ ] Click "إضافة فعالية" button
- [ ] Fill event creation form
  - [ ] Title and description
  - [ ] Date and time
  - [ ] Event type (webinar, workshop, etc.)
  - [ ] Online/offline toggle
  - [ ] Meeting link (if online)
  - [ ] Location (if offline)
  - [ ] Max attendees (optional)
  - [ ] Image URL
- [ ] Click "إنشاء الفعالية"
- [ ] Verify event appears in list
- [ ] Delete an event (if function exposed in UI)

### Feature 3: Files ✓

#### As Regular User:
- [ ] Click "الملفات" (Files) tab
- [ ] View files list
- [ ] Download a file
  - [ ] Click "تنزيل" button
  - [ ] Verify download starts
  - [ ] Verify download count increments

#### As Admin:
- [ ] Click "رفع ملف" button
- [ ] Upload a file
  - [ ] Drag and drop OR click to select
  - [ ] Verify file preview appears
  - [ ] Fill metadata:
    - Title
    - Description
    - File type (auto-detected)
    - Category
    - Version
    - Tags (comma-separated)
    - Thumbnail URL
  - [ ] Click "رفع الملف"
  - [ ] Verify file appears in list
- [ ] Delete a file
  - [ ] Click "حذف" button
  - [ ] Confirm deletion
  - [ ] Verify file is removed

### Feature 4: Admin Management ✓

#### As Admin Only:
- [ ] Navigate to `/community/admin`
- [ ] Click "إدارة المشرفين" tab
- [ ] View admins list
  - [ ] Search for admin by name/email
  - [ ] View admin count
- [ ] View users list
  - [ ] Click "المستخدمون" tab
  - [ ] Search for user
  - [ ] View user count
- [ ] Promote user to admin
  - [ ] Find user in users list
  - [ ] Click "ترقية لمشرف"
  - [ ] Confirm promotion
  - [ ] Verify user moves to admins list
- [ ] Demote admin
  - [ ] Find admin in admins list
  - [ ] Click "إزالة الصلاحيات"
  - [ ] Confirm demotion
  - [ ] Verify admin moves to users list
- [ ] Cannot demote self
  - [ ] Try to demote your own account
  - [ ] Verify error message appears

### Feature 5: Navigation & Landing Page ✓

#### Navigation:
- [ ] Login as regular user
- [ ] Verify "المجتمع" link in navbar
- [ ] Click community link
- [ ] Verify navigation to `/community`
- [ ] Logout
- [ ] Login as user with purchase
- [ ] Verify community link still visible

#### Landing Page:
- [ ] Navigate to home page (`/`)
- [ ] Scroll to Community CTA section
- [ ] Verify section displays:
  - [ ] Title: "تواصل مع مجتمع المبرمجين"
  - [ ] Three feature cards (Posts, Events, Resources)
  - [ ] "انضم للمجتمع مجاناً" button
  - [ ] "متاح لجميع المستخدمين • بدون رسوم" text
- [ ] Click "انضم للمجتمع مجاناً"
- [ ] Verify redirects to login or community page

## PostHog Analytics Verification

Check PostHog dashboard for these events:

- `community_post_created`
- `community_post_liked`
- `community_comment_created`
- `community_event_created`
- `community_event_registered`
- `community_file_uploaded`
- `community_file_downloaded`
- `community_admin_promoted`
- `community_admin_demoted`

## Database Verification

### Check Posts Table
```sql
SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 10;
```

### Check Likes
```sql
SELECT p.title, COUNT(l.id) as like_count
FROM community_posts p
LEFT JOIN community_likes l ON p.id = l.post_id
GROUP BY p.id, p.title;
```

### Check Event Registrations
```sql
SELECT e.title, COUNT(r.id) as registrations, e.max_attendees
FROM community_events e
LEFT JOIN community_event_registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.max_attendees;
```

### Check File Downloads
```sql
SELECT f.title, f.download_count, COUNT(DISTINCT fd.user_id) as unique_downloaders
FROM community_files f
LEFT JOIN community_file_downloads fd ON f.id = fd.file_id
GROUP BY f.id, f.title, f.download_count;
```

### Check Admins
```sql
SELECT full_name, email, is_community_admin
FROM profiles
WHERE is_community_admin = true;
```

## Common Issues & Solutions

### Issue: "Not authorized" errors
**Solution**: Verify user is logged in and RLS policies are properly set up

### Issue: Files not uploading
**Solution**:
1. Check Supabase Storage bucket exists
2. Verify storage policies allow uploads for admins
3. Check file size is under 50MB

### Issue: Events not showing
**Solution**: Check that event dates are in the future

### Issue: Cannot promote/demote admins
**Solution**: Verify you're logged in as an admin

### Issue: Playwright tests failing
**Solution**:
1. Ensure dev server is running on port 3001
2. Check test account credentials are correct
3. Verify database migrations have been run
4. Check browser drivers are installed: `npx playwright install`

## Using Playwright MCP (Advanced)

To enable Playwright MCP tools in Claude Code:

1. Open Claude Code MCP settings
2. Add the Playwright MCP server configuration:
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "node",
         "args": ["C:\\Users\\abins\\Downloads\\playwright-mcp\\dist\\index.js"]
       }
     }
   }
   ```
3. Restart Claude Code
4. Playwright tools will be available with `mcp__playwright__*` prefix

## Next Steps

After manual testing:
1. Create test user accounts in production
2. Run database migrations on production
3. Set up Supabase Storage bucket in production
4. Monitor PostHog for analytics events
5. Set up error monitoring (Sentry/LogRocket)
6. Create admin dashboard for monitoring

---

**Note**: Always test on a staging environment before deploying to production.
