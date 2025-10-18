**# Authentication System - Visual Architecture Diagrams**

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WHALLI AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BROWSER (Frontend - Next.js)                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     auth-client.ts                           │   │
│  │  ├─ signUp(email, password)                                 │   │
│  │  ├─ signIn(email, password)                                 │   │
│  │  ├─ getSession()                                             │   │
│  │  ├─ refreshToken()                                           │   │
│  │  ├─ startGoogleAuth()                                        │   │
│  │  └─ startGitHubAuth()                                        │   │
│  │                                                               │   │
│  │  Storage: localStorage                                       │   │
│  │  ├─ auth_token (JWT, 15m expiry)                            │   │
│  │  └─ refresh_token (JWT, 7d expiry)                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           │ HTTP/HTTPS with Bearer token                           │
│           │ Authorization: Bearer <jwt>                             │
│           ▼                                                          │
│                                                                     │
│  API SERVER (NestJS on :3001)                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ AuthController (10 endpoints)                                │   │
│  │  ├─ POST   /signup           ──► AuthService                │   │
│  │  ├─ POST   /signin           ──► AuthService                │   │
│  │  ├─ GET    /profile (JWT)    ──► JwtAuthGuard               │   │
│  │  ├─ POST   /refresh          ──► AuthService                │   │
│  │  ├─ GET    /google           ──► GoogleStrategy             │   │
│  │  ├─ GET    /github           ──► GitHubStrategy             │   │
│  │  ├─ GET    /google/callback  ──► OAuth redirect             │   │
│  │  ├─ GET    /github/callback  ──► OAuth redirect             │   │
│  │  ├─ POST   /logout           ──► Status check               │   │
│  │  └─ GET    /health           ──► Health check               │   │
│  │                                                               │   │
│  │ AuthService (Core Logic)                                     │   │
│  │  ├─ signUp() ───► Hash (bcrypt) ──► Create User             │   │
│  │  ├─ signIn() ──► Verify (bcrypt) ──► JWT tokens             │   │
│  │  ├─ validateOrCreateOAuthUser() ──► Link/Create             │   │
│  │  ├─ refreshToken() ──► New JWT                              │   │
│  │  └─ findUserById() ──► User lookup                           │   │
│  │                                                               │   │
│  │ Passport Strategies                                          │   │
│  │  ├─ JwtStrategy ──► Validate Bearer tokens                  │   │
│  │  ├─ GoogleStrategy ──► OAuth2 flow                          │   │
│  │  └─ GitHubStrategy ──► OAuth2 flow                          │   │
│  │                                                               │   │
│  │ Guards                                                       │   │
│  │  ├─ JwtAuthGuard ──► Required authentication                │   │
│  │  └─ OptionalJwtGuard ──► Optional authentication            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│           │                                                          │
│           │ SQL Queries                                             │
│           ▼                                                          │
│                                                                     │
│  DATABASE (PostgreSQL / Neon)                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ User Table                                                   │   │
│  │  ├─ id (cuid)                                                │   │
│  │  ├─ email (unique)        ← Email/password auth             │   │
│  │  ├─ password (bcrypt)     ← Nullable for OAuth users        │   │
│  │  ├─ name, image                                              │   │
│  │  ├─ emailVerified, role                                     │   │
│  │  ├─ createdAt, updatedAt                                     │   │
│  │  └─ subscriptionId (fk)                                      │   │
│  │                                                               │   │
│  │ Account Table (OAuth linking)                               │   │
│  │  ├─ id (cuid)                                                │   │
│  │  ├─ userId (fk → User)    ← Link to User                    │   │
│  │  ├─ provider ("google"|"github")                            │   │
│  │  ├─ accountId (OAuth user ID)                               │   │
│  │  └─ tokens (encrypted)                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Email/Password Flow

```
┌─────────────┐
│   Signup    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ POST /auth/signup       │
│ { email, password }     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐      ┌─────────────────┐
│ Check email unique      │─────▶│ DB: Check User  │
└──────┬──────────────────┘      └─────────────────┘
       │ Duplicate?
       ├─ YES ──► Error 400
       │
       └─ NO
         │
         ▼
┌──────────────────────────────┐
│ Hash password                │
│ bcrypt.hash(pass, 10 rounds) │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────┐    ┌──────────────────┐
│ Create User in DB        │───▶│ INSERT INTO user │
│ name, email, pass_hash   │    │ RETURN user_id   │
└──────┬───────────────────┘    └──────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Generate JWT Tokens              │
│ ├─ Access (15m)                  │
│ └─ Refresh (7d)                  │
└──────┬───────────────────────────┘
       │
       ▼
┌───────────────────────────────────┐
│ Return                            │
│ { user, accessToken, refreshToken}│
└───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Browser:                     │
│ localStorage.setItem(token)  │
│ localStorage.setItem(refresh)│
└──────────────────────────────┘
```

## Token Refresh Flow

```
┌────────────────────┐
│ Token Expired      │
│ Try API call       │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────┐
│ Got 401 Unauthorized           │
│ Or access_token expired        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ POST /auth/refresh             │
│ { refreshToken: "..." }        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Verify refresh token           │
│ ├─ Signature OK?               │
│ └─ Not expired (< 7 days)?     │
└────┬───────────────┬───────────┘
     │ Invalid       │ Valid
     │               │
     ▼               ▼
   Error 401    ┌──────────────────────┐
                │ Generate new tokens  │
                │ ├─ Access (15m)      │
                │ └─ Refresh (7d)      │
                └────┬─────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Return new tokens    │
          │ Update browser       │
          │ Retry original call  │
          └──────────────────────┘
```

## Protected Route Access

```
┌──────────────────────────────────┐
│ GET /auth/profile                │
│ Authorization: Bearer <token>    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ @UseGuards(JwtAuthGuard)         │
│ 1. Extract Bearer token          │
└──────┬───────────────────────────┘
       │
       ├─ Missing? ──► 401 Unauthorized
       │
       └─ Present?
         │
         ▼
┌──────────────────────────────────┐
│ JwtStrategy.validate()           │
│ 1. Verify JWT signature          │
│ 2. Decode payload                │
│ 3. Check expiry                  │
└──────┬───────────────────────────┘
       │
       ├─ Invalid? ──► 401 Unauthorized
       │
       └─ Valid?
         │
         ▼
┌──────────────────────────────────┐
│ PrismaService.findUnique(id)     │
│ SELECT * FROM user WHERE id = ?  │
└──────┬───────────────────────────┘
       │
       ├─ Not found? ──► 401 Unauthorized
       │
       └─ Found?
         │
         ▼
┌──────────────────────────────────┐
│ Attach user to request object    │
│ req.user = {...}                 │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Execute controller method        │
│ getProfile() { return req.user } │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Return 200 OK                    │
│ { user: {...} }                  │
└──────────────────────────────────┘
```

## OAuth2 Flow (Google/GitHub)

```
┌─────────────────────────┐
│ User clicks "Login"     │
│ "with Google/GitHub"    │
└────────┬────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ GET /auth/google (or /github)      │
│ GoogleStrategy/GitHubStrategy      │
│ kicks in                           │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Redirect to Google/GitHub OAuth    │
│ ?client_id=...&scope=...&...       │
└────────┬───────────────────────────┘
         │
         ▼
    ┌─────────────────┐
    │ User Logs In    │
    │ Grants Scope    │
    └────────┬────────┘
             │
             ▼
┌───────────────────────────────────┐
│ Redirect to callback URI          │
│ /auth/google/callback?code=...    │
└────────┬────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ GoogleStrategy.validate()          │
│ 1. Exchange code for access_token  │
│ 2. Fetch user profile              │
│ 3. Extract: email, name, photo    │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ authService.validateOrCreate()     │
│ 1. Find Account by provider+id     │
└────────┬───────────────────────────┘
         │
         ├─ Account found?
         │  │
         │  └─ YES: Link existing User
         │       │
         │       └─► Continue
         │
         └─ NO: Check User by email
              │
              ├─ User exists? Link account
              │
              └─ User not exists? Create both
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ INSERT User          │
                        │ INSERT Account       │
                        └──────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Generate JWT tokens                │
│ ├─ Access (15m)                    │
│ └─ Refresh (7d)                    │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Redirect to callback or return JWT │
│ Browser stores tokens in localStorage
└────────────────────────────────────┘
         │
         ▼
    ┌────────────────────┐
    │ User Logged In     │
    │ Redirect to home   │
    └────────────────────┘
```

---

**Created**: October 17, 2025
**System**: NestJS + Passport.js
**Status**: ✅ Complete & Operational

