**# Authentication API - Quick Test Guide**

## 1. Start the API
```bash
cd apps/api
npm run dev
# Or with build
npm run build && node dist/main.js
```

API will be available at: **http://localhost:3001/api**

## 2. Health Check
```bash
curl http://localhost:3001/api/auth/health
# Response: { "status": "ok", "timestamp": "2025-10-17T..." }
```

## 3. Email/Password Registration

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "name": "Test User"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "cuid_generated",
    "email": "test@example.com",
    "name": "Test User",
    "image": null,
    "emailVerified": false,
    "createdAt": "2025-10-17T10:05:18Z",
    "updatedAt": "2025-10-17T10:05:18Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## 4. Email/Password Login

```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
```

**Response:** Same structure as signup (user + tokens)

## 5. Get Current User Profile (Protected)

```bash
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
{
  "user": {
    "id": "cuid_generated",
    "email": "test@example.com",
    "name": "Test User",
    "image": null,
    "emailVerified": false,
    "createdAt": "2025-10-17T10:05:18Z",
    "updatedAt": "2025-10-17T10:05:18Z"
  }
}
```

## 6. Refresh Access Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## 7. Test Error Handling

### Invalid Credentials
```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }'
# Response: 401 Unauthorized - "Invalid credentials"
```

### Missing JWT Token
```bash
curl http://localhost:3001/api/auth/profile
# Response: 401 Unauthorized - "Unauthorized"
```

### Duplicate User Registration
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "AnotherPassword"
  }'
# Response: 400 Bad Request - "User already exists"
```

## 8. Google OAuth Setup (Optional)

### Get Credentials
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID (Web Application)
3. Add Authorized JavaScript origins: `http://localhost:3001`
4. Add Authorized redirect URIs: `http://localhost:3001/auth/google/callback`

### Configure Environment
```bash
# In .env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

### Test Flow
```bash
# 1. Browser redirects to:
# http://localhost:3001/api/auth/google

# 2. After login, redirects to callback and returns JWT
```

## 9. GitHub OAuth Setup (Optional)

### Get Credentials
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3001/auth/github/callback`

### Configure Environment
```bash
# In .env
GITHUB_CLIENT_ID=your-client-id-here
GITHUB_CLIENT_SECRET=your-client-secret-here
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

### Test Flow
```bash
# 1. Browser redirects to:
# http://localhost:3001/api/auth/github

# 2. After login, redirects to callback and returns JWT
```

## 10. Database Setup

### Migrations
```bash
cd apps/api

# Apply migrations
npm run db:migrate

# Or for production
npx prisma migrate deploy

# View database
npm run db:studio
```

### .env Configuration
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
```

## 11. API Routes Summary

| Method | Endpoint | Protection | Description |
|--------|----------|-----------|-------------|
| GET | `/auth/health` | ❌ | Health check |
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/signin` | ❌ | Login existing user |
| GET | `/auth/profile` | ✅ JWT | Get current user |
| POST | `/auth/refresh` | ❌ | Get new access token |
| GET | `/auth/google` | 🔄 OAuth | Start Google login |
| GET | `/auth/google/callback` | 🔄 OAuth | Google OAuth redirect |
| GET | `/auth/github` | 🔄 OAuth | Start GitHub login |
| GET | `/auth/github/callback` | 🔄 OAuth | GitHub OAuth redirect |
| POST | `/auth/logout` | ❌ | Logout confirmation |

## 12. Testing with Postman/Insomnia

### Import Collection
Create requests in Postman with:
- Base URL: `http://localhost:3001/api`
- Set `Authorization` header as Bearer token from signup/signin responses

### Common Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

## 13. Troubleshooting

### "OAuth2Strategy requires a clientID option"
- ❌ OAuth env vars not configured
- ✅ Solution: Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET or GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

### "User already exists"
- ❌ Email already registered
- ✅ Solution: Use different email or signin instead

### "Invalid refresh token"
- ❌ Refresh token expired or invalid
- ✅ Solution: Sign in again to get fresh tokens

### "JWT malformed"
- ❌ Token format incorrect
- ✅ Solution: Ensure "Bearer " prefix in Authorization header

---

## 🎯 Next: Frontend Integration

Once API is tested, integrate with frontend:

1. Update `/apps/web/src/lib/auth-client.ts` to call new endpoints
2. Test email/password flow in web UI
3. Implement OAuth redirect buttons
4. Store JWT in localStorage/secure cookie
5. Add Authorization header to all API requests

