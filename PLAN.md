# VTA Tennis Club — Web Portal & Mobile App

## Overview

Two-phase project building a web portal and mobile app for a tennis club.

- **Phase 1:** Web portal — member-facing dashboard + polished admin panel
- **Phase 2:** Mobile app — iOS & Android using the same Firebase backend

---

## Tech Stack

### Phase 1 — Web Portal
| Layer | Technology |
|---|---|
| Frontend framework | React (Vite) |
| Admin panel | React Admin + Firebase data provider |
| Authentication | Firebase Auth (email/password) |
| Database | Firestore (NoSQL) |
| Hosting | Firebase Hosting |
| Styling | Material UI (bundled with React Admin) + Bootstrap 5 (member portal) |

### Phase 2 — Mobile App
| Layer | Technology |
|---|---|
| Framework | Expo (React Native) |
| Backend | Same Firebase project as Phase 1 |
| Payments | Stripe (React Native SDK) |

---

## Project Structure

```
vta/
├── .env                          # Firebase secrets (gitignored)
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
├── firebase.json                 # Firebase Hosting config
├── .firebaserc                   # Firebase project alias
├── src/
│   ├── main.jsx                  # App entry point
│   ├── App.jsx                   # Router setup
│   ├── firebase/
│   │   ├── config.js             # Firebase init (reads from .env)
│   │   └── auth.js               # Auth helper functions
│   ├── components/
│   │   ├── ProtectedRoute.jsx    # Redirects unauthenticated users to login
│   │   └── AdminRoute.jsx        # Redirects non-admins away from /admin
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx         # Read-only member profile view
│   ├── admin/
│   │   ├── index.jsx             # React Admin app entry
│   │   ├── dataProvider.js       # Firestore data provider for React Admin
│   │   ├── authProvider.js       # Firebase auth provider for React Admin
│   │   └── resources/
│   │       └── members/
│   │           ├── MemberList.jsx
│   │           ├── MemberEdit.jsx
│   │           └── MemberShow.jsx
│   └── styles/
│       └── index.css
```

---

## Firestore Data Models

### Collection: `users`
Created automatically on registration via Firebase Auth trigger.

| Field | Type |
|---|---|
| uid | string (matches Firebase Auth UID) |
| email | string |
| firstName | string |
| lastName | string |
| isAdmin | boolean (default: false) |
| createdAt | timestamp |

### Collection: `memberProfiles`
One document per user. Created automatically on registration.

| Field | Type |
|---|---|
| userId | string (reference to users UID) |
| phone | string |
| street | string |
| city | string |
| state | string |
| zipCode | string |
| membershipStart | timestamp |
| membershipExpiry | timestamp |
| paymentStatus | string (paid / unpaid / pending) |
| level | number (1.0–5.0 in 0.5 steps, nullable) |

---

## URL Routes

| Route | Component | Access |
|---|---|---|
| `/` | Redirect → dashboard or login | — |
| `/login` | Login.jsx | Public |
| `/register` | Register.jsx | Public |
| `/dashboard` | Dashboard.jsx | Authenticated users only |
| `/admin` | React Admin app | Admin users only |
| `/admin/members` | MemberList.jsx | Admin users only |
| `/admin/members/:id` | MemberShow.jsx / MemberEdit.jsx | Admin users only |

---

## Key Components

### Member Portal
- **Login.jsx** — email/password login via Firebase Auth
- **Register.jsx** — creates Firebase Auth user + Firestore `users` doc + blank `memberProfiles` doc
- **Dashboard.jsx** — read-only view of the logged-in user's `memberProfiles` document
- **ProtectedRoute.jsx** — checks Firebase Auth state; redirects to `/login` if unauthenticated
- **AdminRoute.jsx** — checks `isAdmin` flag in Firestore `users` doc; redirects non-admins

### Admin Panel (React Admin)
- **MemberList** — paginated, searchable, filterable table of all member profiles
- **MemberEdit** — form to edit any member's profile fields
- **MemberShow** — read-only detail view
- **CSV Export** — React Admin's built-in `<ExportButton>` handles CSV download
- **dataProvider.js** — connects React Admin to Firestore using `ra-data-firestore`
- **authProvider.js** — connects React Admin login/logout to Firebase Auth

---

## Packages (`package.json`)

```
react
react-dom
react-router-dom
firebase
react-admin
ra-data-firestore
@mui/material
@emotion/react
@emotion/styled
vite
@vitejs/plugin-react
```

---

## Firebase Services Required

- **Authentication** — Email/Password provider enabled
- **Firestore** — Native mode, production rules (see below)
- **Hosting** — Single-page app rewrite rule (`/**` → `/index.html`)

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own user doc
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Users can read their own profile; admins can read/write all
    match /memberProfiles/{profileId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## Setup Sequence

1. Create Firebase project at console.firebase.google.com
2. Enable **Authentication** → Email/Password
3. Enable **Firestore** → Start in production mode
4. Enable **Hosting**
5. Install Firebase CLI: `npm install -g firebase-tools`
6. `firebase login` and `firebase init` (select Hosting + Firestore)
7. `npm create vite@latest vta -- --template react`
8. Install dependencies: `npm install firebase react-router-dom react-admin ra-data-firestore @mui/material @emotion/react @emotion/styled`
9. Create `.env` with Firebase config values
10. Write `firebase/config.js` (reads from `.env`)
11. Build auth flows: Login, Register, ProtectedRoute, AdminRoute
12. Build member Dashboard
13. Build React Admin panel (dataProvider, authProvider, resources)
14. Write and deploy Firestore security rules
15. `firebase deploy`

---

## Verification

- Register a new account → verify redirect to dashboard showing blank profile
- Log out → log back in → verify dashboard loads
- Attempt `/dashboard` while logged out → verify redirect to `/login`
- Attempt `/admin` as a regular user → verify redirect away
- Log in as admin → verify member list loads in React Admin
- Edit a member record in admin → verify Firestore updates
- Export members as CSV from admin → verify download
- Attempt to read another user's profile via Firestore rules → verify denied

---

## Phase 2 — Mobile App (Future)

- Initialise Expo project: `npx create-expo-app vta-mobile`
- Connect to same Firebase project
- Implement login, registration, and member dashboard screens in React Native
- Add Stripe SDK for program registration payments
- Submit to App Store (iOS) and Google Play (Android)

---

## Future Considerations

- **Background jobs** (e.g. expiry reminder emails) → Firebase Functions
- **File uploads** (e.g. waivers) → Firebase Storage
- **Program registration** → new Firestore collection + Stripe integration
- **Push notifications** → Firebase Cloud Messaging (FCM)
