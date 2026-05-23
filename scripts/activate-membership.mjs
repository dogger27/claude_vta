import { readFileSync } from 'fs';
import { homedir } from 'os';

const config = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
const token = config.tokens.access_token;
const uid = 'dhbB209zujaCJItyDD06CFnW9902';
const project = 'vancouver-tennis-association';
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const start  = new Date('2026-05-18T00:00:00.000Z');
const expiry = new Date('2027-05-18T00:00:00.000Z');
const now    = new Date();

// Patch memberProfiles: set membership active
const profileRes = await fetch(
  `${base}/memberProfiles/${uid}?updateMask.fieldPaths=paymentStatus&updateMask.fieldPaths=membershipStart&updateMask.fieldPaths=membershipExpiry&updateMask.fieldPaths=updatedAt`,
  {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: {
      paymentStatus:    { stringValue: 'paid' },
      membershipStart:  { timestampValue: start.toISOString() },
      membershipExpiry: { timestampValue: expiry.toISOString() },
      updatedAt:        { timestampValue: now.toISOString() },
    }}),
  }
);
const profileJson = await profileRes.json();
console.log('memberProfiles patch:', profileJson.name ? '✓' : profileJson.error);
