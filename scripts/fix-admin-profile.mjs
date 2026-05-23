import { readFileSync } from 'fs';
import { homedir } from 'os';

const config = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
const token = config.tokens.access_token;
const uid = 'dhbB209zujaCJItyDD06CFnW9902';
const project = 'vancouver-tennis-association';
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const now = { timestampValue: new Date().toISOString() };

// Patch users doc with full fields
const userRes = await fetch(`${base}/users/${uid}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ fields: {
    uid:       { stringValue: uid },
    email:     { stringValue: 'pdwiens@gmail.com' },
    firstName: { stringValue: 'Paul' },
    lastName:  { stringValue: 'Wiens' },
    isAdmin:   { booleanValue: true },
    createdAt: now,
  }}),
});
console.log('users doc:', (await userRes.json()).name ? '✓' : 'error');

// Create memberProfiles doc
const profileRes = await fetch(`${base}/memberProfiles/${uid}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ fields: {
    userId:          { stringValue: uid },
    firstName:       { stringValue: 'Paul' },
    lastName:        { stringValue: 'Wiens' },
    email:           { stringValue: 'pdwiens@gmail.com' },
    phone:           { stringValue: '7787738620' },
    street:          { stringValue: '5740 Grousewoods Crescent' },
    city:            { stringValue: 'North Vancouver' },
    state:           { stringValue: 'BC' },
    zipCode:         { stringValue: 'V7R4V8' },
    level:           { doubleValue: 3.5 },
    paymentStatus:   { stringValue: 'pending' },
    membershipStart: { nullValue: null },
    membershipExpiry:{ nullValue: null },
    createdAt: now,
    updatedAt: now,
  }}),
});
console.log('memberProfiles doc:', (await profileRes.json()).name ? '✓' : 'error');
