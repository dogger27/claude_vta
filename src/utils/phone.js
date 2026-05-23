import {
  parsePhoneNumber, getCountries, getCountryCallingCode, getExampleNumber,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

export const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

const PINNED = ['CA', 'US', 'GB', 'AU', 'NZ'];
const allCountries = getCountries()
  .map(code => ({ code, name: countryNames.of(code) ?? code, dialCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRIES = [
  ...PINNED.map(code => allCountries.find(c => c.code === code)).filter(Boolean),
  null, // separator
  ...allCountries.filter(c => !PINNED.includes(c.code)),
];

export const legacyToE164 = (stored) => {
  if (!stored) return '';
  if (stored.startsWith('+')) return stored;
  const digits = stored.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return stored;
};

export const formatPhone = (stored) => {
  if (!stored) return '—';
  try {
    const parsed = parsePhoneNumber(legacyToE164(stored));
    return parsed?.isValid() ? parsed.formatInternational() : stored;
  } catch {
    return stored;
  }
};

export const getExpectedDigits = (countryCode) => {
  try {
    const ex = getExampleNumber(countryCode, examples);
    return ex ? ex.nationalNumber.length : null;
  } catch {
    return null;
  }
};

export const localPreview = (countryCode, localDigits) => {
  if (!localDigits || localDigits.length < 4) return null;
  try {
    const e164 = `+${getCountryCallingCode(countryCode)}${localDigits}`;
    const parsed = parsePhoneNumber(e164);
    return parsed?.isValid() ? parsed.formatInternational() : null;
  } catch {
    return null;
  }
};

export const parseStoredPhone = (stored) => {
  try {
    if (!stored) return { country: 'CA', local: '' };
    const parsed = parsePhoneNumber(legacyToE164(stored));
    if (parsed?.country) return { country: parsed.country, local: parsed.nationalNumber };
  } catch { /* fall through */ }
  return { country: 'CA', local: '' };
};
