# Keycloak Setup Guide for Angola Platform

## Architecture Overview

**Important:** In this micro-frontend architecture:
- ✅ **Shell App (jul-portal)** - Handles ALL Keycloak authentication
- ✅ **Micro-Apps (lpco-cnca-app, etc.)** - Receive auth state from shell via `SharedAuthService`
- ❌ **Micro-Apps DO NOT need separate Keycloak configuration**

### Why This Approach?
1. **Single Sign-On**: User logs in once through the shell
2. **Shared Auth State**: Token and user info shared via RxJS observable
3. **Simpler Setup**: Only configure Keycloak clients for the shell
4. **Better Performance**: No duplicate auth initialization

---

## Prerequisites
- Keycloak running on Docker at http://localhost:8080
- Admin access to Keycloak

## Step 1: Access Keycloak Admin Console
1. Open http://localhost:8080
2. Click on "Administration Console"
3. Login with admin credentials (default: admin/admin from docker-compose.yml)

## Step 2: Create Realm
1. Click on the dropdown in the top-left (currently showing "Master")
2. Click "Create Realm"
3. Enter realm name: `angola-platform`
4. Click "Create"

## Step 3: Create Client for Shell App (jul-portal)

**Note:** Only the shell app needs a Keycloak client. Micro-apps inherit authentication.

1. In the angola-platform realm, go to "Clients"
2. Click "Create client"
3. Configure:
   - **Client ID**: `jul-portal`
   - **Client Type**: `OpenID Connect`
   - Click "Next"
4. Capability config:
   - **Client authentication**: OFF (public client)
   - **Authorization**: OFF
   - **Standard flow**: ON
   - **Direct access grants**: ON
   - Click "Next"
5. Login settings:
   - **Root URL**: `http://localhost:4200`
   - **Home URL**: `http://localhost:4200`
   - **Valid redirect URIs**:
     - `http://localhost:4200/*`
     - `http://127.0.0.1:4200/*`
   - **Valid post logout redirect URIs**:
     - `http://localhost:4200/*`
     - `http://127.0.0.1:4200/*`
   - **Web origins**:
     - `http://localhost:4200`
     - `http://127.0.0.1:4200`
   - Click "Save"

## Step 4: ~~Create Client for Micro App~~ (NOT NEEDED)

**Skip this step!** Micro-apps receive authentication from the shell app via `SharedAuthService`. They don't need their own Keycloak client configuration.

## Step 5: Create Test User
1. Go to "Users" in the left menu
2. Click "Create new user"
3. Fill in:
   - **Username**: `testuser`
   - **Email**: `testuser@angola.ae` (or any email)
   - **Email verified**: ON
   - **First name**: `Test`
   - **Last name**: `User`
4. Click "Create"
5. Go to "Credentials" tab
6. Click "Set password"
7. Enter password: `Test@123` (or your choice)
8. Set "Temporary": OFF
9. Click "Save"

## Step 6: Create Roles (Optional)
1. Go to "Realm roles"
2. Click "Create role"
3. Create these roles:
   - `admin`
   - `user`
   - `lpco-officer`
4. Assign roles to user:
   - Go to "Users" → Select user → "Role mapping"
   - Click "Assign role"
   - Select roles to assign
   - Click "Assign"

## Step 7: Start Docker Keycloak (if not running)
```bash
docker-compose up -d keycloak
```

## Step 8: Test the Setup
1. Start your Angular applications:
   ```bash
   npm run serve:jul-portal
   npm run serve:lpco-cnca-app
   ```

2. Open http://localhost:4200
3. Click "Login with Keycloak"
4. Enter credentials (testuser / Test@123)
5. You should be redirected back and see your username
6. Navigate to LPCO CNCA App - it will show your auth status from the shell

## Configuration Files Created
- ✅ **Shell App (jul-portal)**:
  - Environment files with Keycloak config
  - Auth service for authentication operations
  - Updated app.config.ts with `provideKeycloak()` (modern approach)
  - Silent SSO check HTML file
  - Login/Logout UI in home component

- ✅ **Shared Library**:
  - SharedAuthService for auth state sharing between apps

- ✅ **Micro-Apps**:
  - NO Keycloak config (receives auth from shell)
  - Uses SharedAuthService to access auth state

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Check that Web Origins are set correctly in Keycloak clients
2. Verify the URLs match exactly (http://localhost vs http://127.0.0.1)

### Redirect Issues
- Ensure Valid Redirect URIs include wildcards (*)
- Check that the realm name matches in both Keycloak and environment.ts

##**Only** Shell Client: jul-portal
- Micro-apps: Receive auth from shell in client settings (should be public client)
- Check that "Standard flow" is enabled

## Environment Configuration

### Development (Current)
- Keycloak URL: http://localhost:8080
- Realm: angola-platform
- Shell Client: jul-portal
- Micro App Client: lpco-cnca-app

### Production (UAE)
Update in shell app's environment.prod.ts only:
```typescript
keycloak: {
  url: 'https://auth.yourdomain.ae',
  realm: 'angola-platform',
  clientId: 'jul-portal',
}
```

## How Auth Sharing Works

```
┌─────────────────────────────────────────┐
│  Shell App (jul-portal)                 │
│  - Keycloak Login/Logout                │
│  - Manages Tokens                       │
│  - Updates SharedAuthService            │
└────────────┬────────────────────────────┘
             │
             │ authState$ Observable
             │
             ▼
┌─────────────────────────────────────────┐
│  SharedAuthService (Shared Library)     │
│  - BehaviorSubject<AuthState>           │
│  - Broadcasts auth changes              │
└────────────┬────────────────────────────┘
             │
             │ Subscribe
             │
             ▼
┌─────────────────────────────────────────┐
│  Micro-Apps (lpco-cnca-app, etc.)       │
│  - Subscribe to authState$              │
│  - Access username, roles, token        │
│  - NO Keycloak config needed            │
└─────────────────────────────────────────┘
```

## Next Steps
1. ✅ Complete the Keycloak setup above
2. Configure additional roles and permissions
3. Add role-based route guards
4. Implement token refresh logic
5. Add user profile management
