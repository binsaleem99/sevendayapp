# MCP Browser Automation Testing Guide

## Overview

You now have **TWO** browser automation MCP servers installed and configured:

1. **Playwright MCP** - For isolated E2E testing
2. **BrowserMCP** - For testing with your logged-in browser

Both are configured in `C:\Users\abins\.claude.json` and will be available after restarting Claude Code.

## Comparison

### Playwright MCP
**Command**: `node C:\Users\abins\Downloads\playwright-mcp\cli.js`

**Best For:**
- ✅ Automated E2E testing
- ✅ CI/CD pipelines
- ✅ Testing across multiple browsers (Chrome, Firefox, Safari)
- ✅ Isolated test environments
- ✅ Reproducible tests

**Features:**
- Creates fresh browser instances
- No existing login sessions
- May trigger bot detection on some sites
- Official Microsoft project
- Full Playwright API

**Use Cases:**
- Running your Playwright test suite (`npm run test:community`)
- Cross-browser compatibility testing
- Automated regression testing
- CI/CD integration

### BrowserMCP
**Command**: `npx -y @browsermcp/mcp`

**Best For:**
- ✅ Testing with real user sessions
- ✅ Avoiding bot detection
- ✅ Testing logged-in features
- ✅ Manual exploration/debugging
- ✅ Fast local automation

**Features:**
- Uses YOUR existing Chrome browser
- Already logged into all services
- Avoids CAPTCHAs and bot detection
- Stealth mode (uses real browser fingerprint)
- Local automation (private)

**Requires:**
- BrowserMCP Chrome extension (needs to be installed)
- Chrome browser

**Use Cases:**
- Testing community features while logged in as admin
- Testing file uploads/downloads with real accounts
- Testing payment flows with logged-in sessions
- Quick manual testing and debugging

## Setup Instructions

### Playwright MCP (Ready ✅)
Already configured and ready to use after Claude Code restart. No additional setup needed.

### BrowserMCP Setup Required

#### Step 1: Install Chrome Extension
1. Visit Chrome Web Store
2. Search for "BrowserMCP" or visit https://browsermcp.io
3. Click "Add to Chrome"
4. Pin the extension to your toolbar

#### Step 2: Start BrowserMCP Server
The server is already configured in Claude Code, but you need the extension running.

#### Step 3: Verify Connection
After restarting Claude Code:
1. Open Chrome with BrowserMCP extension
2. The extension should show "Connected" status
3. MCP tools will be available with `mcp__browsermcp__*` prefix

## Testing Workflow Recommendations

### Option 1: Isolated Testing (Playwright MCP)
**Best for initial development and CI/CD**

```bash
# Run automated tests
npm run test:community

# Run with UI for debugging
npm run test:ui

# Run specific test
npx playwright test -g "should allow user to create a post"
```

**Pros:**
- Fully automated
- Reproducible
- Fast execution
- Works in CI/CD

**Cons:**
- Requires test accounts setup in database
- Not logged in to services
- May need to handle authentication in tests

### Option 2: Real Browser Testing (BrowserMCP)
**Best for manual testing and debugging**

After Claude Code restart, you can use BrowserMCP tools to:
- Navigate to http://localhost:3001
- Interact with the community features
- Test while logged in as your admin account
- Upload real files
- Test event registrations
- Verify UI/UX flow

**Pros:**
- Already logged in
- Real user experience
- No test account setup needed
- Great for debugging

**Cons:**
- Manual interaction required
- Requires Chrome extension
- Not suitable for CI/CD

## Recommended Testing Strategy

### Phase 1: Initial Development (Current)
Use **Playwright MCP** for automated testing:
1. Create test accounts in Supabase
2. Run database migrations
3. Execute `npm run test:community`
4. Fix any failing tests

### Phase 2: Manual Verification
Use **BrowserMCP** for manual testing:
1. Login as admin in Chrome
2. Use BrowserMCP to automate clicks/navigation
3. Test file uploads with real files
4. Verify event registration flow
5. Test admin management features

### Phase 3: Pre-Production
Use **both** tools:
1. Playwright MCP for regression tests
2. BrowserMCP for final manual verification
3. Check PostHog analytics
4. Verify all user flows

## Available MCP Tools (After Restart)

### Playwright MCP Tools
Expected tools will have prefix: `mcp__playwright__*`

Common actions:
- Navigate to pages
- Click elements
- Fill forms
- Take screenshots
- Wait for elements
- Execute JavaScript

### BrowserMCP Tools
Expected tools will have prefix: `mcp__browsermcp__*`

Common actions:
- Navigate in your actual Chrome browser
- Interact with logged-in sessions
- Click buttons and links
- Fill forms with real data
- Take screenshots of actual state

## Testing the Community Features

### Using Playwright MCP

```typescript
// Example test flow
1. Navigate to http://localhost:3001/login
2. Fill in test@example.com / password
3. Click login
4. Navigate to /community
5. Click "Posts" tab
6. Create a new post
7. Verify post appears
8. Like the post
9. Add a comment
10. Verify comment appears
```

### Using BrowserMCP

After restart, you can use natural language:
- "Navigate to localhost:3001/community"
- "Click the Events tab"
- "Click Register for the first event"
- "Upload a file to the Files section"
- "Click on Admin Management tab"

## Configuration Files

### Claude Code MCP Config
**Location**: `C:\Users\abins\.claude.json`

Should contain:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["C:\\Users\\abins\\Downloads\\playwright-mcp\\cli.js"]
    },
    "browsermcp": {
      "command": "npx",
      "args": ["-y", "@browsermcp/mcp"]
    }
  }
}
```

## Troubleshooting

### Playwright MCP Issues

**Issue**: Tests fail with "Cannot find element"
**Solution**:
- Check selectors match your Arabic UI text
- Use data-testid attributes for reliable selection
- Verify dev server is running on port 3001

**Issue**: Authentication fails in tests
**Solution**:
- Verify test accounts exist in Supabase
- Check credentials in test file
- Ensure RLS policies allow test user access

### BrowserMCP Issues

**Issue**: Extension shows "Disconnected"
**Solution**:
- Restart Chrome
- Reinstall extension
- Check that BrowserMCP MCP server is running

**Issue**: Tools not available in Claude Code
**Solution**:
- Verify you restarted Claude Code
- Check `~/.claude.json` configuration
- Try `claude mcp list` to verify servers

**Issue**: "Cannot control browser"
**Solution**:
- Make sure Chrome is open
- Extension must be enabled
- Check extension has necessary permissions

## Next Steps

1. **Restart Claude Code** - Activate both MCP tools
2. **Install BrowserMCP Extension** - For real browser testing
3. **Run Playwright Tests** - Automated E2E testing
4. **Manual Testing** - Use BrowserMCP for logged-in testing
5. **Document Results** - Note any issues found

## Which One to Use?

### Use Playwright MCP When:
- Writing automated tests
- Need cross-browser testing
- Running in CI/CD
- Want isolated test environment
- Testing authentication flows from scratch

### Use BrowserMCP When:
- Quick manual testing
- Already logged in as admin
- Testing file uploads/downloads
- Debugging UI issues
- Verifying real user experience
- Testing integrations with logged-in services

### Use Both When:
- Comprehensive testing needed
- Pre-production validation
- Verifying all user flows
- Maximum confidence before deploy

## Resources

- **Playwright MCP**: https://github.com/microsoft/playwright-mcp
- **BrowserMCP**: https://browsermcp.io
- **Playwright Docs**: https://playwright.dev
- **Test Suite**: `tests/community-features.spec.ts`
- **Testing Guide**: `TESTING.md`

---

**Status**: Both MCP servers installed ✅
**Next Action**: Restart Claude Code to activate
**Then**: Install BrowserMCP Chrome extension
**Finally**: Start testing! 🚀
