import { useState, useEffect } from 'react';

const isCanadianStart = (v) => /^[A-Z]/i.test(v);

const fmt = (raw) => {
  const up = raw.toUpperCase();
  if (isCanadianStart(up)) {
    const c = up.replace(/[^A-Z0-9]/g, '').slice(0, 6);
    return c.length > 3 ? `${c.slice(0, 3)} ${c.slice(3)}` : c;
  }
  return up.replace(/[^0-9]/g, '').slice(0, 5);
};

const isComplete = (v) =>
  /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(v) ||
  /^\d{5}$/.test(v);

const mapUrl = (code) => {
  const country = isCanadianStart(code) ? 'Canada' : 'USA';
  const q = encodeURIComponent(`${code}, ${country}`);
  return `https://maps.google.com/maps?q=${q}&output=embed&z=14`;
};

export default function PostalCodeInput({ value, onChange, inputClassName = 'form-control', size }) {
  const [raw, setRaw] = useState(value || '');
  const [confirmed, setConfirmed] = useState(!!value);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!value) { setRaw(''); setConfirmed(false); setShowMap(false); }
  }, [value]);

  const handleChange = (e) => {
    const formatted = fmt(e.target.value);
    setRaw(formatted);
    setConfirmed(false);
    setShowMap(isComplete(formatted));
  };

  const confirm = () => { setConfirmed(true); setShowMap(false); onChange(raw); };
  const reenter = () => { setRaw(''); setShowMap(false); setConfirmed(false); onChange(''); };

  return (
    <>
      <div className="input-group" style={size === 'sm' ? { maxWidth: 160 } : { maxWidth: 190 }}>
        <input
          className={`${inputClassName} text-uppercase`}
          value={raw}
          onChange={handleChange}
          maxLength={raw && isCanadianStart(raw) ? 7 : 5}
          placeholder=""
          style={{ letterSpacing: '0.08em' }}
          readOnly={confirmed}
        />
        {confirmed && (
          <button type="button" className={`btn btn-outline-secondary ${size === 'sm' ? 'btn-sm' : ''}`} onClick={reenter} title="Change">✎</button>
        )}
      </div>
      {confirmed && <div className="form-text text-success">✓ {raw}</div>}

      {showMap && !confirmed && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1070 }}>
          <div className="card shadow-lg" style={{ width: '100%', maxWidth: 500, margin: '1rem' }}>
            <div className="card-header d-flex align-items-center justify-content-between">
              <strong>Confirm your location</strong>
              <button type="button" className="btn-close" onClick={reenter} aria-label="Close" />
            </div>
            <div className="card-body p-0">
              <iframe
                src={mapUrl(raw)}
                title="Location map"
                style={{ width: '100%', height: 300, border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between gap-2">
              <span className="text-muted small">Is <strong>{raw}</strong> your postal / zip code?</span>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={reenter}>Re-enter</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={confirm}>Yes, confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
