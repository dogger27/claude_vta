import { useState, useEffect } from 'react';
import { useInput } from 'react-admin';
import { isValidPhoneNumber, getCountryCallingCode } from 'libphonenumber-js';
import {
  COUNTRIES, getExpectedDigits, localPreview, parseStoredPhone,
} from '../utils/phone';

export default function PhoneInput({ source = 'phone', label = 'Phone' }) {
  const { field, fieldState } = useInput({
    source,
    validate: (value) => {
      if (!value) return undefined;
      try {
        if (!isValidPhoneNumber(value)) return 'Please complete the phone number';
      } catch {
        return 'Please complete the phone number';
      }
      return undefined;
    },
  });

  const [country, setCountry] = useState('CA');
  const [local, setLocal]     = useState('');
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    if (!ready && field.value) {
      const { country: c, local: l } = parseStoredPhone(field.value);
      setCountry(c);
      setLocal(l);
      setReady(true);
    }
  }, [field.value, ready]);

  const handleCountryChange = (e) => {
    setCountry(e.target.value);
    setLocal('');
    field.onChange('');
  };

  const handleLocalChange = (e) => {
    const expected = getExpectedDigits(country);
    const digits   = e.target.value.replace(/\D/g, '');
    const capped   = expected ? digits.slice(0, expected) : digits;
    setLocal(capped);
    field.onChange(capped ? `+${getCountryCallingCode(country)}${capped}` : '');
  };

  const expected  = getExpectedDigits(country);
  const preview   = localPreview(country, local);
  const remaining = expected ? expected - local.length : null;
  const hasError  = !!fieldState.error;

  const borderColor = preview
    ? '#2e7d32'
    : hasError || (local && !preview)
      ? '#d32f2f'
      : 'rgba(0,0,0,0.23)';

  return (
    <div style={{ marginBottom: '16px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: hasError ? '#d32f2f' : 'rgba(0,0,0,0.6)', marginBottom: '6px' }}>
        {label}
      </div>

      <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)', marginBottom: '3px' }}>Country Code</div>
      <select
        value={country}
        onChange={handleCountryChange}
        style={{
          width: '100%', padding: '8.5px 14px', marginBottom: '10px',
          border: '1px solid rgba(0,0,0,0.23)', borderRadius: '4px',
          fontSize: '1rem', background: '#fff',
        }}
      >
        {COUNTRIES.map((c, i) =>
          c === null
            ? <option key="sep" disabled>────────────────────</option>
            : <option key={c.code} value={c.code}>{c.name} (+{c.dialCode})</option>
        )}
      </select>

      <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)', marginBottom: '3px' }}>Phone Number</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{
          padding: '8.5px 14px', border: '1px solid rgba(0,0,0,0.23)', borderRadius: '4px',
          background: '#f5f5f5', fontSize: '1rem', whiteSpace: 'nowrap',
        }}>
          +{getCountryCallingCode(country)}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={local}
          onChange={handleLocalChange}
          placeholder={expected ? `${expected} digits` : 'local number'}
          maxLength={expected ?? undefined}
          style={{
            flex: 1, padding: '8.5px 14px',
            border: `1px solid ${borderColor}`,
            borderRadius: '4px', fontSize: '1rem',
          }}
        />
      </div>

      <div style={{ fontSize: '0.75rem', marginTop: '4px', minHeight: '1.2em' }}>
        {preview
          ? <span style={{ color: '#2e7d32' }}>✓ {preview}</span>
          : hasError
            ? <span style={{ color: '#d32f2f' }}>{fieldState.error?.message}</span>
            : expected && !local
              ? <span style={{ color: 'rgba(0,0,0,0.5)' }}>Please enter {expected} digits</span>
              : expected && remaining > 0
                ? <span style={{ color: 'rgba(0,0,0,0.5)' }}>{remaining} more digit{remaining !== 1 ? 's' : ''} needed</span>
                : null
        }
      </div>
    </div>
  );
}
