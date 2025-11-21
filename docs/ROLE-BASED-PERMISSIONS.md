# Role-Based Tool Permissions

This document describes the role-based permission system that filters MCP tools before they're sent to OpenAI.

## Quick Start

**For Backend Developers:** Add `x-required-roles` to your OpenAPI operations:
```json
{
  "operationId": "UsersController_deactivate",
  "x-required-roles": ["admin", "super_admin", "hr"]
}
```

**For Frontend:** Permissions are automatically enforced - no code changes needed. Just run `npm run tools:generate` after updating the OpenAPI spec.

## Overview

The system prevents unauthorized tool access by:
1. **Source**: Role requirements defined in OpenAPI spec (`x-required-roles` field)
2. **Generation**: Roles automatically converted to IDs during `npm run tools:generate`
3. **Runtime**: User roles fetched from backend API and cached in MongoDB (10-minute TTL)
4. **Filtering**: Tools filtered based on `allowedRoleIds` before sending to OpenAI

**Benefits:**
- ✅ **Single source of truth** - permissions defined in OpenAPI spec alongside API definitions
- ✅ **Automatic** - no manual step required when adding/updating tools
- ✅ **Prevents wasted tokens** - unauthorized tools never sent to OpenAI
- ✅ **Reduces errors** - no 403 responses from backend for unauthorized attempts
- ✅ **Better security** - tool names hidden from unauthorized users
- ✅ **Better UX** - assistant won't attempt unauthorized operations

## Role Hierarchy

| Role ID | Role Name (Display)   | Role Name (OpenAPI)  |
|---------|----------------------|---------------------|
| 1       | Super Administrator   | `super_admin`       |
| 2       | Administrator         | `admin`             |
| 3       | People Manager (HR)   | `hr`                |
| 4       | User                  | `user`              |
| 5       | Project Manager       | `pm`                |
| 6       | QA Engineer          | `qa`                |
| 7       | Developer            | `developer`         |
| 8       | Designer             | `designer`          |
| 9       | Financial Manager    | `financial_manager` |
| 10      | Business Analyst     | `ba`                |
| 11      | Sales                | `sales`             |
| 12      | Freelancer           | `freelancer`        |

**Role Name Mapping:** Role names in the OpenAPI spec (`x-required-roles`) are automatically converted to role IDs during tool generation. The mapping is defined in [scripts/generate-mcp-tools.ts](../scripts/generate-mcp-tools.ts) (lines 71-84).

## How It Works

### 1. Authentication Flow

When a request comes in:

```typescript
// apps/web/src/middleware/auth.middleware.ts
1. Extract JWT token from Authorization header
2. Validate token and get userId
3. Fetch roleId from:
   - JWT payload (if present), OR
   - MongoDB cache, OR
   - Backend /auth/me endpoint (then cache)
4. Attach to req.user.roleId
```

### 2. Tool Metadata

Each tool in [tool-metadata.json](../apps/mcp-server/src/tool-metadata.json) has an `allowedRoleIds` array:

```json
{
  "name": "users-deactivate",
  "allowedRoleIds": [1, 2, 3]  // Super Admin, Admin, and HR
}
```

**Source of Truth:** The `x-required-roles` field in the OpenAPI specification ([postman-descriptions-roles.json](../data/api-collections/postman-descriptions-roles.json)):

```json
{
  "operationId": "UsersController_deactivate",
  "x-required-roles": ["admin", "super_admin", "hr"]
}
```

**Automatic Generation:**
- Role permissions are automatically extracted during tool generation
- Role names (e.g., `"super_admin"`, `"admin"`) are converted to role IDs (e.g., `[1, 2]`)
- Tools without `x-required-roles` have no restrictions (all roles allowed)

### 3. Tool Filtering

Before sending tools to OpenAI:

```typescript
// apps/web/src/chat/openai-integration.ts
const openaiTools = await getOpenAiTools(userRoleId);
// Returns only tools where allowedRoleIds includes userRoleId
```

### 4. MongoDB Caching

Cache schema:

```typescript
{
  userId: number,
  roleId: number,
  roleName?: string,
  email: string,
  cachedAt: Date,
  expiresAt: Date  // TTL index - auto-expires after 10 minutes
}
```

## File Changes

### New Files

1. **[apps/web/src/models/user-role-cache.model.ts](../apps/web/src/models/user-role-cache.model.ts)**
   - MongoDB schema for role caching
   - TTL index for automatic expiration

2. **[apps/web/src/services/user-role.service.ts](../apps/web/src/services/user-role.service.ts)**
   - `getUserRole()` - Fetch role with caching
   - `clearUserRoleCache()` - Clear cache for a user

3. **[apps/web/src/services/tool-permission.service.ts](../apps/web/src/services/tool-permission.service.ts)**
   - `canAccessTool()` - Check if user can access a tool
   - `filterToolsByRole()` - Filter tool arrays by role

4. **[scripts/add-role-permissions.ts](../scripts/add-role-permissions.ts)**
   - ⚠️ **DEPRECATED** - No longer needed with automatic extraction
   - Originally used to manually add `allowedRoleIds` to tool metadata
   - Now replaced by automatic extraction from OpenAPI spec

### Modified Files

1. **[apps/web/src/utils/auth.ts](../apps/web/src/utils/auth.ts)**
   - Added `roleId?` and `roleName?` to `AuthUser` interface

2. **[apps/web/src/middleware/auth.middleware.ts](../apps/web/src/middleware/auth.middleware.ts)**
   - Now async to fetch and cache role
   - Attaches `roleId` to `req.user`

3. **[apps/web/src/chat/openai-integration.ts](../apps/web/src/chat/openai-integration.ts)**
   - `getOpenAiTools()` accepts `userRoleId` parameter
   - Filters tools before returning
   - `chat()` accepts `userRoleId` parameter

4. **[apps/web/src/chat/chat.service.ts](../apps/web/src/chat/chat.service.ts)**
   - `handleChatTurn()` accepts `userRoleId` parameter
   - Passes role to OpenAI integration

5. **[apps/web/src/chat/chat.controller.ts](../apps/web/src/chat/chat.controller.ts)**
   - Extracts `roleId` from `req.user`
   - Passes to chat service

6. **[apps/mcp-server/src/tool-metadata.json](../apps/mcp-server/src/tool-metadata.json)**
   - All 112 tools now have `allowedRoleIds` array
   - Auto-generated during `npm run tools:generate`

7. **[scripts/generate-mcp-tools.ts](../scripts/generate-mcp-tools.ts)**
   - Added `ROLE_NAME_TO_ID` mapping constant (lines 71-84)
   - Updated `ToolMetadata` type to include `allowedRoleIds` (line 67)
   - Added `extractAllowedRoleIds()` function (lines 743-765)
   - Modified `genOneTool()` to extract and add `allowedRoleIds` (lines 893-894)

## Testing

Run the test script to verify filtering:

```bash
npx tsx test-role-filtering.ts
```

Example output:
```
Test 1: Super Admin (roleId = 1)
✅ Accessible tools: users-find-all, users-deactivate, users-activate, events-approve
   Total: 4/4

Test 2: Regular User (roleId = 4)
✅ Accessible tools: users-find-all
   Total: 1/4
```

## Configuration

### Cache TTL

Default: 10 minutes

To change, edit [user-role.service.ts](../apps/web/src/services/user-role.service.ts):

```typescript
const CACHE_TTL_MS = 10 * 60 * 1000; // Change this value
```

### Default Role

If role fetch fails, defaults to roleId 4 (User - most restrictive):

```typescript
const DEFAULT_ROLE_ID = 4;
```

## Customizing Permissions

### Option 1: Update OpenAPI Spec (Recommended)

Edit the `x-required-roles` field in [postman-descriptions-roles.json](../data/api-collections/postman-descriptions-roles.json):

```json
{
  "operationId": "ProjectsController_getFinancialSummary",
  "x-required-roles": ["super_admin", "admin", "financial_manager"]
}
```

Then regenerate tools:

```bash
npm run tools:generate
```

The `allowedRoleIds` will be automatically updated to `[1, 2, 9]`.

### Option 2: Manual Edit (Quick Fix)

Directly edit [tool-metadata.json](../apps/mcp-server/src/tool-metadata.json):

```json
{
  "name": "projects-financial-summary",
  "allowedRoleIds": [1, 2, 9]  // Super Admin, Admin, Financial Manager
}
```

⚠️ **Warning:** Manual edits will be preserved during regeneration, but it's better to update the source (OpenAPI spec).

### Option 3: Runtime Override

For per-user exceptions, modify the auth middleware to set custom roleIds:

```typescript
// Special case: give user 42 admin privileges
if (user.id === 42) {
  user.roleId = 2;
}
```

## Clearing Cache

To force role refresh (e.g., after role change):

```typescript
import { clearUserRoleCache } from './services/user-role.service.js';

await clearUserRoleCache(userId);
```

Or delete from MongoDB:

```bash
db.userrolecaches.deleteOne({ userId: 123 })
```

## Security Notes

1. **Defense in Depth**: Backend API still validates permissions
2. **Fail-Safe**: If metadata missing, tool access is allowed (fail-open)
3. **Default Role**: On error, defaults to most restrictive role (User)
4. **Cache Poisoning**: 10-minute TTL limits impact of cache poisoning
5. **JWT Trust**: System trusts JWT signature from backend

## Troubleshooting

### Tools not filtering correctly

1. Check role is being fetched:
   ```bash
   # Add logging in auth.middleware.ts
   console.log('User roleId:', user.roleId);
   ```

2. Verify metadata has allowedRoleIds:
   ```bash
   grep -A 3 '"name": "users-deactivate"' apps/mcp-server/src/tool-metadata.json
   ```

3. Clear cache and retry:
   ```bash
   db.userrolecaches.deleteMany({})
   ```

### Backend /auth/me returns different structure

Update [user-role.service.ts](../apps/web/src/services/user-role.service.ts) to match your API response:

```typescript
interface AuthMeResponse {
  // Update this to match your backend response
  role: { id: number; name: string };
}
```

## Performance Impact

- **First request**: +100-500ms (backend API call + MongoDB write)
- **Cached requests**: +5-10ms (MongoDB read)
- **Tool filtering**: <1ms (in-memory map lookup)

## Workflow

### Adding/Updating Tool Permissions

1. **Update OpenAPI Spec**: Add or modify `x-required-roles` in [postman-descriptions-roles.json](../data/api-collections/postman-descriptions-roles.json)
   ```json
   {
     "operationId": "NewController_newAction",
     "x-required-roles": ["admin", "super_admin"]
   }
   ```

2. **Regenerate Tools**: Run the generation script
   ```bash
   npm run tools:generate
   ```

3. **Verify**: Check that [tool-metadata.json](../apps/mcp-server/src/tool-metadata.json) has correct `allowedRoleIds`

4. **Deploy**: Changes take effect immediately on next request

### Role Name Reference

When adding `x-required-roles` to the OpenAPI spec, use these exact role names:
- `super_admin`, `admin`, `hr`, `user`, `pm`, `qa`, `developer`, `designer`, `financial_manager`, `ba`, `sales`, `freelancer`

**Important:** Role names are case-sensitive and use snake_case.

## Future Enhancements

1. ✅ **Automatic Role Extraction** - COMPLETED: Roles now extracted from OpenAPI spec
2. **JWT Enhancement**: Include roleId in JWT to eliminate cache entirely
3. **Permission Groups**: Define named permission groups (e.g., "hr_tools")
4. **Dynamic Permissions**: Fetch per-user permissions from backend
5. **Audit Logging**: Track blocked tool access attempts
6. **Admin UI**: Web interface to manage tool permissions
