# Vancouver Tennis Association — Member Portal

Web portal for the Vancouver Tennis Association (VTA), built with React and Firebase.

## Features

### Member Portal
- Registration with email validation, phone, postal/zip code, and NTRP self-rating
- Profile management (photo upload with crop, contact info, GLTA & Tennis Canada member IDs)
- Membership status, renewal via Stripe, and transaction history

### Admin Panel
- Member list with search, export, and full profile editing
- Play Sessions spreadsheet (inline-editable schedule)
- Programs management
- Permission-based access (admin + active membership required)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Admin panel | React Admin |
| Auth & Database | Firebase (Auth, Firestore) |
| File storage | Firebase Storage |
| Payments | Stripe (Cloud Functions) |
| Hosting | Firebase Hosting |

## Local Development

```bash
npm install
npm run dev        # starts localhost:5173
```

Requires a `.env` file with Firebase config values (not committed — contact the project owner).

## Deployment

```bash
npm run build
firebase deploy
```

Live at: https://vancouver-tennis-association.web.app
