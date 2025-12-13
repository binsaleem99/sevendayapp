# Fix Community Page Routing - Admin Page at /community

## Problem
The community page routing is currently backwards:
- **Current:** Public page at `/community`, admin page at `/community/admin`
- **Desired:** Admin page at `/community` (admin-only access)

## Root Cause
Misinterpreted the user's request for "SEPARATE ADMIN & PUBLIC COMMUNITY PAGES" - created two pages when user wanted the original admin page to be the only page at `/community`.

## Solution: Restore Original Configuration

### Approach
Delete the public CommunityPage.tsx and restore CommunityAdminPage.tsx as the main CommunityPage.tsx at `/community` route with admin protection.

### Files to Modify

#### 1. Delete Public CommunityPage.tsx
**File:** `pages/CommunityPage.tsx` (the new public version)
**Action:** Delete this file entirely

#### 2. Rename CommunityAdminPage.tsx → CommunityPage.tsx
**File:** `pages/CommunityAdminPage.tsx`
**Action:**
- Rename file to `CommunityPage.tsx`
- Update component name from `CommunityAdminPage` to `CommunityPage`
- Keep all admin protection logic intact (lines 39-51)
- Update export to `export default CommunityPage`

**Admin Protection (KEEP THIS):**
```typescript
useEffect(() => {
  if (!loading) {
    if (!supabaseUser) {
      navigate('/login');
      return;
    }
    if (!profile?.is_community_admin && profile?.role !== 'admin') {
      navigate('/'); // Redirect to home if not admin
      return;
    }
  }
}, [supabaseUser, profile, loading, navigate]);
```

#### 3. Update App.tsx Routes
**File:** `App.tsx`
**Changes:**
- Import: Change `CommunityAdminPage` back to `CommunityPage` from `./pages/CommunityPage`
- Routes: Keep only `/community` route pointing to `CommunityPage`
- Remove: Delete `/community/admin` route completely

**Before:**
```typescript
import CommunityPage from './pages/CommunityPage';           // Public (WRONG)
import CommunityAdminPage from './pages/CommunityAdminPage'; // Admin

<Route path="/community" element={<CommunityPage />} />
<Route path="/community/admin" element={<CommunityAdminPage />} />
```

**After:**
```typescript
import CommunityPage from './pages/CommunityPage'; // Admin-only

<Route path="/community" element={<CommunityPage />} />
// /community/admin route REMOVED
```

### Implementation Steps

1. **Delete** `pages/CommunityPage.tsx` (public version)
2. **Read** `pages/CommunityAdminPage.tsx` to get current content
3. **Write** new `pages/CommunityPage.tsx` with admin protection:
   - Copy all content from CommunityAdminPage.tsx
   - Change component name to `CommunityPage`
   - Change redirect target in admin protection from `/community` to `/` (home)
   - Keep all admin checks intact
4. **Delete** `pages/CommunityAdminPage.tsx` (no longer needed)
5. **Edit** `App.tsx`:
   - Update import statement
   - Remove `/community/admin` route
   - Keep only `/community` route

### Expected Result

After implementation:
- ✅ `/community` → Admin-only page with full features (posts/events/files tabs)
- ✅ Non-admins redirected to home page (`/`)
- ✅ Non-authenticated users redirected to `/login`
- ✅ No public community page
- ✅ No `/community/admin` route

### Testing Checklist

- [ ] Admin user can access `/community`
- [ ] Non-admin user redirected to home when accessing `/community`
- [ ] Non-authenticated user redirected to `/login`
- [ ] All tabs work (posts, events, files)
- [ ] Post creation works
- [ ] Community stats display correctly
- [ ] No console errors
- [ ] Routes in App.tsx are clean (no duplicate community routes)

## Notes

- This restores the original intent: one admin-only community page at `/community`
- All previous fixes remain intact (free community, fixed text colors, Gemini sidebar)
- The admin protection logic is preserved and strengthened
