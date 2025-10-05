# AuthGuard Implementation - NestJS API

## Overview

The `AuthGuard` validates Better-Auth sessions from the Next.js web app and protects API routes in the NestJS backend.

## How It Works

1. **Token Extraction**: Reads session token from:
   - `Authorization: Bearer <token>` header
   - `better-auth.session_token` cookie

2. **Session Validation**: Calls the Better-Auth session endpoint at the web app to verify the token

3. **User Attachment**: Attaches the authenticated user object to the request for use in controllers

4. **Route Protection**: Applied via `@UseGuards(AuthGuard)` decorator

## Files Created

### 1. `src/auth/auth.guard.ts`
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  // Validates session by calling Better-Auth API
  // Throws UnauthorizedException if invalid
}

// Custom decorator to extract user from request
export const CurrentUser = createParamDecorator(...)
```

**Key Methods:**
- `canActivate()` - Main guard logic
- `extractTokenFromRequest()` - Gets token from header or cookies
- `validateSession()` - Validates session with Better-Auth API

**Environment Variables:**
- `AUTH_API_URL` - URL of the Next.js web app (default: `http://localhost:3000`)

### 2. `src/auth/auth.module.ts`
```typescript
@Module({
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
```

### 3. Protected Controllers

#### `src/projects/projects.controller.ts`
```typescript
@Controller('api/projects')
@UseGuards(AuthGuard) // Protect all routes
export class ProjectsController {
  @Get()
  async getUserProjects(@CurrentUser() user: any) {
    // user object is automatically injected
  }
}
```

**Protected Routes:**
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

#### `src/chat/chat.controller.ts`
```typescript
@Controller('api/chat')
@UseGuards(AuthGuard) // Protect all routes
export class ChatController {
  @Post('messages')
  async sendMessage(@CurrentUser() user: any, @Body() dto: ...) {
    // user.id is used to authorize message creation
  }
}
```

**Protected Routes:**
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages` - Get messages (with pagination)
- `GET /api/chat/messages/:id` - Get specific message
- `GET /api/chat/projects/:projectId/history` - Get chat history
- `POST /api/chat/messages/:id/attachments` - Add attachments
- `GET /api/chat/stats` - Get chat statistics

## Usage Examples

### Protect an Entire Controller

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard';

@Controller('api/my-resource')
@UseGuards(AuthGuard) // All routes require authentication
export class MyResourceController {
  @Get()
  getAll(@CurrentUser() user: any) {
    console.log('Authenticated user:', user);
    // user contains: { id, email, name, avatar, ... }
  }
}
```

### Protect Specific Routes

```typescript
@Controller('api/my-resource')
export class MyResourceController {
  @Get('public')
  getPublic() {
    // No authentication required
  }

  @Get('private')
  @UseGuards(AuthGuard) // Only this route requires authentication
  getPrivate(@CurrentUser() user: any) {
    // Authenticated route
  }
}
```

### Use CurrentUser Decorator

```typescript
@Get('profile')
@UseGuards(AuthGuard)
async getProfile(@CurrentUser() user: any) {
  // user object contains authenticated user data
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
```

### Combine with Other Guards

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard) // Multiple guards
export class AdminController {
  // ...
}
```

## Environment Setup

### 1. Update `.env`

```env
# URL of the Next.js web app that handles Better-Auth
AUTH_API_URL=http://localhost:3000

# Or in production
AUTH_API_URL=https://yourdomain.com
```

### 2. Update `app.module.ts`

The modules are already imported in `src/app.module.ts`:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,    // ✅ Added
    ProjectsModule, // ✅ Uses AuthGuard
    ChatModule,     // ✅ Uses AuthGuard
    // ... other modules
  ],
})
export class AppModule {}
```

## Testing Authentication

### 1. Get a Session Token

**Option A: Login via Web App**
```bash
# Start web app
cd apps/web
pnpm dev

# Visit http://localhost:3000/login
# Sign in and open browser DevTools
# Go to Application → Cookies
# Copy the value of 'better-auth.session_token'
```

**Option B: Use API**
```bash
# Sign in via API (if you've exposed the auth routes)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### 2. Test Protected Endpoints

**With Authorization Header:**
```bash
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**With Cookie:**
```bash
curl http://localhost:3001/api/projects \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

**Expected Success Response (200):**
```json
[
  {
    "id": "...",
    "title": "My Project",
    "description": "...",
    "owner": { ... },
    "members": [ ... ]
  }
]
```

**Expected Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "No authentication token found"
}
```

## How Sessions Are Validated

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   Client    │          │   NestJS API │          │  Next.js    │
│             │          │  (port 3001) │          │  (port 3000)│
└──────┬──────┘          └──────┬───────┘          └──────┬──────┘
       │                        │                         │
       │ 1. Request with token  │                         │
       │───────────────────────>│                         │
       │                        │                         │
       │                        │ 2. Validate session     │
       │                        │────────────────────────>│
       │                        │                         │
       │                        │ 3. Return user data     │
       │                        │<────────────────────────│
       │                        │                         │
       │ 4. Return resource     │                         │
       │<───────────────────────│                         │
       │                        │                         │
```

## Error Handling

The guard throws `UnauthorizedException` in these cases:

1. **No token found**
   ```json
   { "statusCode": 401, "message": "No authentication token found" }
   ```

2. **Invalid token**
   ```json
   { "statusCode": 401, "message": "Invalid or expired session" }
   ```

3. **Session API unreachable**
   ```json
   { "statusCode": 401, "message": "Failed to validate session" }
   ```

## Services with Authorization

### ProjectsService

All methods check authorization:

```typescript
async getUserProjects(userId: string) {
  // Returns only projects where user is owner or member
}

async createProject(data: { ownerId: string, ... }) {
  // Automatically adds owner as OWNER role member
}

async updateProject(projectId: string, userId: string, data: ...) {
  // Only owner can update
  // Throws ForbiddenException if not owner
}
```

### ChatService

All methods verify access:

```typescript
async sendMessage(data: { userId: string, projectId: string, ... }) {
  // Verifies user has access to project
  // Throws ForbiddenException if no access
}

async getMessages(data: { projectId: string, userId: string, ... }) {
  // Only returns messages if user has project access
}
```

## Security Best Practices

### ✅ Implemented

- [x] Session validation via Better-Auth API
- [x] Token extraction from headers and cookies
- [x] Authorization checks in services
- [x] User object attached to requests
- [x] Owner-only operations (update, delete)
- [x] Member-only operations (view, comment)

### 🔄 Recommended Additions

- [ ] Rate limiting on auth endpoints
- [ ] IP-based restrictions for admin routes
- [ ] Audit logging for sensitive operations
- [ ] Role-based access control (RBAC)
- [ ] Permission-based guards
- [ ] Request signing for API-to-API calls

## Performance Considerations

### Current Approach
Each request makes an HTTP call to validate the session:
- **Pros**: Always fresh, no stale sessions
- **Cons**: Additional network latency

### Alternative: JWT Verification
For better performance, you could:
1. Issue JWTs from Better-Auth
2. Verify JWTs locally with public key
3. Cache public key with rotation

### Caching Strategy
Add Redis caching to reduce validation calls:
```typescript
// Cache session for 5 minutes
const cachedUser = await redis.get(`session:${token}`);
if (cachedUser) return JSON.parse(cachedUser);

const user = await this.validateSession(token);
await redis.setex(`session:${token}`, 300, JSON.stringify(user));
```

## Troubleshooting

### "Connection refused to localhost:3000"

**Problem**: NestJS API can't reach Next.js web app

**Solution**:
1. Make sure web app is running: `pnpm --filter=@whalli/web dev`
2. Check `AUTH_API_URL` in `.env`
3. Use Docker network name if containerized

### "Invalid or expired session"

**Problem**: Token is valid but guard rejects it

**Solution**:
1. Check that `NEXTAUTH_SECRET` matches in both apps
2. Verify session hasn't expired (7 days)
3. Check Better-Auth configuration in web app

### "No authentication token found"

**Problem**: Token not being sent correctly

**Solution**:
1. Verify token is in `Authorization: Bearer <token>` header
2. Or in cookie as `better-auth.session_token=<token>`
3. Check CORS configuration if calling from browser

## CORS Configuration

For browser-based requests, configure CORS in `main.ts`:

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002',
  ],
  credentials: true, // Allow cookies
});
```

## Next Steps

1. ✅ **Test the guard**: Use curl or Postman to test protected endpoints
2. ✅ **Add more controllers**: Protect TasksController, UsersController, etc.
3. 🔄 **Implement RBAC**: Create RolesGuard for role-based access
4. 🔄 **Add permissions**: Create PermissionsGuard for fine-grained control
5. 🔄 **Cache sessions**: Add Redis caching for performance
6. 🔄 **Audit logging**: Log all authenticated requests

## Example: Full Request Flow

```typescript
// 1. User signs in via web app
POST http://localhost:3000/api/auth/signin
Body: { email, password }
Response: Sets cookie 'better-auth.session_token'

// 2. User makes API request from web app
GET http://localhost:3001/api/projects
Headers: Cookie: better-auth.session_token=abc123...

// 3. AuthGuard intercepts request
- Extracts token from cookie
- Calls http://localhost:3000/api/auth/session
- Validates session
- Attaches user to request

// 4. Controller receives request
@Get()
getUserProjects(@CurrentUser() user) {
  // user = { id: '...', email: '...', name: '...' }
}

// 5. Service uses user ID
async getUserProjects(userId: string) {
  return this.prisma.project.findMany({
    where: { ownerId: userId }
  });
}
```

---

**Status**: ✅ **FULLY IMPLEMENTED AND READY TO USE**

The AuthGuard is configured and protecting the ProjectsController and ChatController. Test it by starting both the web app and API, then making authenticated requests!
