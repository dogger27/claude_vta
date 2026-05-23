# Changelog

All notable changes to the VTA Member Portal are documented here.

---

## [Unreleased]

---

## [0.1.0] — 2026-05-23

### Member Portal
- Registration form with validation (all fields required, passwords must match)
- Email uniqueness check on blur — shows sign-in / password reset options immediately if taken
- Full postal / zip code input with Google Maps confirmation popup (Canadian and US formats)
- Profile dashboard with tabs: Profile, Membership, Transactions
- Profile photo upload with crop tool, compression, and lightbox view
- Editable profile fields: name, email, phone (with country code), city, province, postal/zip, NTRP rating
- GLTA and Tennis Canada Member ID fields with help links and lookup instructions
- NTRP self-rating guide (? popover with full level descriptions)
- Membership status, start/expiry dates, and Stripe payment flow
- Transaction history table
- Password reset flow from login page

### Admin Panel
- Member list with search, sort, CSV export, and postal/zip column
- Member detail view (personal info, address, membership, GLTA/Tennis Canada IDs)
- Member edit form
- Create member via Cloud Function (generates password reset link)
- Play Sessions inline spreadsheet (date/time, cancelled, courts, location, type, manager, note)
- Programs resource (list, create, edit, show)
- Tab navigation (Members | Programs | Play Sessions)
- Custom app bar matching member portal branding (VTA logo, user dropdown with photo)
- Permission level column in member list (Admin / Standard chip)
- Admin access requires both admin flag and active membership

### Infrastructure
- Firebase Auth (email/password)
- Firestore collections: users, memberProfiles, memberships, programs, playSessions
- Firebase Storage for profile photos (4 MB limit, images only)
- Firebase Hosting with SPA rewrite rules
- Stripe checkout sessions via Cloud Functions (CAD $50 annual membership)
- Membership renewal logic: extends from current expiry if active, from today if lapsed
- Firestore security rules for all collections
- Storage security rules (users write only to their own path)
