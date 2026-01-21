# Keycloak Authentication Architecture

## ✅ Correct Setup (Current Implementation)

```
┌──────────────────────────────────────────────────────────┐
│                     USER LOGIN FLOW                       │
└──────────────────────────────────────────────────────────┘

1. User opens Shell App (http://localhost:4200)
2. Clicks "Login with Keycloak"
3. Keycloak login page appears
4. User enters credentials
5. Redirected back to Shell App
6. Shell App receives token from Keycloak
7. Shell App updates SharedAuthService
8. All micro-apps automatically get auth state

┌──────────────────────────────────────────────────────────┐
│                   TECHNICAL FLOW                          │
└──────────────────────────────────────────────────────────┘

    SHELL APP (jul-portal)
    ├── Keycloak Configuration ✓
    │   ├── environment.ts (Keycloak URL, realm, clientId)
    │   ├── app.config.ts (provideKeycloak - modern approach)
    │   └── auth.service.ts (wraps KeycloakService)
    │
    ├── Updates SharedAuthService
    │   └── authState$ = { isAuthenticated, username, roles, token }
    │
    └── UI Components
        └── Login/Logout buttons

    ↓ (authState$ Observable)

    SHARED LIBRARY (libs/shared/data-access)
    └── SharedAuthService
        ├── BehaviorSubject<AuthState>
        └── Broadcasts auth changes to all subscribers

    ↓ (Subscribe to authState$)

    MICRO-APPS (lpco-cnca-app, etc.)
    ├── NO Keycloak Configuration ✗
    ├── NO environment files for Keycloak ✗
    ├── NO keycloak-init.ts ✗
    │
    └── Components subscribe to SharedAuthService
        └── Access: username, roles, token, isAuthenticated

┌──────────────────────────────────────────────────────────┐
│                   FILE STRUCTURE                          │
└──────────────────────────────────────────────────────────┘

apps/
├── shell-apps/
│   └── jul-portal/
│       ├── src/
│       │   ├── environments/
│       │   │   ├── environment.ts          ← Keycloak config
│       │   │   └── environment.prod.ts     ← Keycloak config
│       │   ├── app/
│       │   │   ├── auth/
│       │   │   │   └── auth.service.ts     ← Wraps Keycloak
│       │   │   ├── app.config.ts           ← provideKeycloak()
│       │   │   └── home/
│       │   │       └── home.component.ts   ← Login/Logout UI
│       │   └── ...
│       └── public/
│           └── assets/
│               └── silent-check-sso.html   ← SSO helper
│
└── micro-apps/
    └── lpco-cnca-app/
        └── src/
            ├── app/
            │   ├── nx-welcome.ts           ← Uses SharedAuthService
            │   └── app.config.ts           ← No Keycloak provider
            └── NO environments/            ← Removed!
            └── NO auth/                    ← Removed!

libs/
└── shared/
    └── data-access/
        └── src/lib/
            └── shared-auth.service.ts      ← Shared auth state

┌──────────────────────────────────────────────────────────┐
│           KEYCLOAK SETUP REQUIREMENTS                     │
└──────────────────────────────────────────────────────────┘

In Keycloak Admin Console:

1. Create Realm: "angola-platform"

2. Create ONE Client: "jul-portal" (for shell only)
   - Client ID: jul-portal
   - Client Type: OpenID Connect
   - Valid Redirect URIs: http://localhost:4200/*
   - Web Origins: http://localhost:4200

3. Create Users and assign roles

NO NEED to create client for micro-apps!

┌──────────────────────────────────────────────────────────┐
│              BENEFITS OF THIS APPROACH                    │
└──────────────────────────────────────────────────────────┘

✅ Single Sign-On across all apps
✅ Centralized auth management
✅ No duplicate Keycloak configs
✅ Easier to maintain
✅ Better performance (single auth initialization)
✅ Consistent auth state across apps
✅ Micro-apps remain lightweight
