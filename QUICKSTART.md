# 🚀 Quick Start Guide - Whalli Authentication

Get up and running with Whalli's authentication system in 5 minutes!

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL database running

## Step 1: Install Dependencies

```bash
cd /home/geekmonstar/code/projects/whalli
pnpm install
```

## Step 2: Setup Environment Variables

### For apps/web:

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local` and set:

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE

# Your PostgreSQL database
DATABASE_URL=postgresql://postgres:password@localhost:5432/whalli

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### For apps/api (if not already set):

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` and set:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/whalli
```

## Step 3: Setup Database

```bash
# From monorepo root
cd /home/geekmonstar/code/projects/whalli

# Generate Prisma client
pnpm --filter=@whalli/api prisma generate

# Push schema to database
pnpm --filter=@whalli/api prisma db push
```

Expected output:
```
✔ Generated Prisma Client (5.x.x) to ...
✔ Your database is now in sync with your schema.
```

## Step 4: Start Development Server

```bash
# From monorepo root
cd /home/geekmonstar/code/projects/whalli

# Option 1: Start just the web app
pnpm --filter=@whalli/web dev

# Option 2: Start all apps (web, api, admin)
pnpm dev
```

The web app will be available at: **http://localhost:3000**

## Step 5: Test Authentication

### 5.1 Create an Account

1. Open http://localhost:3000
2. Click **"Sign up"** or go to http://localhost:3000/signup
3. Fill in:
   - **Full Name**: Your Name
   - **Email**: your.email@example.com
   - **Password**: At least 8 characters
   - **Confirm Password**: Same as password
4. Click **"Create Account"**
5. You'll be redirected to http://localhost:3000/dashboard

### 5.2 Test Protected Routes

1. While logged in, go to http://localhost:3000/dashboard
2. You should see your dashboard with profile information
3. Click **"Sign Out"**
4. Try accessing http://localhost:3000/dashboard again
5. You should be redirected to http://localhost:3000/login

### 5.3 Sign In

1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click **"Sign In"**
4. You'll be redirected back to the dashboard

## ✅ Success!

You now have a fully functional authentication system with:
- ✅ Email & Password authentication
- ✅ Protected routes
- ✅ Session management
- ✅ Secure password storage
- ✅ Beautiful login/signup pages

## 🔧 Optional: Add Google OAuth

### 1. Get Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy your **Client ID** and **Client Secret**

### 2. Add to .env.local

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Restart Server

```bash
# Stop the server (Ctrl+C)
# Start again
pnpm --filter=@whalli/web dev
```

### 4. Test Google OAuth

1. Go to http://localhost:3000/login
2. Click **"Continue with Google"**
3. Select your Google account
4. You'll be redirected to the dashboard

## 🐛 Troubleshooting

### "Database connection error"

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or with Docker
docker ps | grep postgres

# Verify DATABASE_URL in .env.local
cat apps/web/.env.local | grep DATABASE_URL
```

### "Prisma Client not generated"

**Problem**: Getting Prisma import errors

**Solution**:
```bash
pnpm --filter=@whalli/api prisma generate
```

### "Invalid credentials" error

**Problem**: Can't sign in with correct password

**Solution**:
- Make sure you're using the exact email you signed up with
- Passwords are case-sensitive
- Try creating a new account to test

### Build fails with TypeScript errors

**Problem**: `tsc --noEmit` shows errors

**Solution**:
```bash
# Make sure all dependencies are installed
pnpm install

# Check for any remaining errors
pnpm --filter=@whalli/web type-check
```

### Google OAuth redirect error

**Problem**: "Redirect URI mismatch" error

**Solution**:
- Verify the redirect URI in Google Console is exactly:
  ```
  http://localhost:3000/api/auth/callback/google
  ```
- No trailing slash!
- Check that NEXT_PUBLIC_APP_URL in .env.local is `http://localhost:3000`

## 📚 Next Steps

Now that authentication is working, you can:

1. **Customize the UI**: Edit files in `apps/web/src/app/`
2. **Add more features**: Create new pages in the app directory
3. **Integrate with API**: Use the session to make authenticated API calls
4. **Deploy**: Follow the deployment guide in `DEPLOYMENT.md`

## 🎯 Testing Checklist

- [ ] Sign up with a new account
- [ ] Sign out
- [ ] Sign in with the same account
- [ ] Try accessing /dashboard while signed out (should redirect to /login)
- [ ] Sign in and get redirected back to /dashboard
- [ ] Check that session persists after page reload
- [ ] (Optional) Test Google OAuth if configured

## 📖 Documentation

- **Full Authentication Guide**: See `AUTHENTICATION.md`
- **Web App README**: See `apps/web/README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Main README**: See `README.md`

## 💡 Tips

- Use the VS Code tasks to start development:
  - Press `Cmd/Ctrl + Shift + P`
  - Type "Tasks: Run Task"
  - Select "Start Web App"

- View database with Prisma Studio:
  ```bash
  pnpm --filter=@whalli/api prisma studio
  ```
  Opens at http://localhost:5555

- Generate a secure secret quickly:
  ```bash
  openssl rand -base64 32
  ```

- Check if the web app is running:
  ```bash
  curl http://localhost:3000/api/auth/session
  ```

---

**Need help?** Check the troubleshooting section or review the documentation files.

**Ready for production?** See `DEPLOYMENT.md` for deployment instructions.
