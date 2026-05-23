import { readFileSync } from 'fs';
import { homedir } from 'os';

const config = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
const token = config.tokens.access_token;
const uid = 'dhbB209zujaCJItyDD06CFnW9902';
const project = 'vancouver-tennis-association';

const res = await fetch(
  `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=isAdmin`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { isAdmin: { booleanValue: true } } }),
  }
);
const data = await res.json();
console.log(data.name ? `✓ isAdmin set for ${uid}` : JSON.stringify(data));
