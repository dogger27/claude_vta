import { useState, useEffect, useRef } from 'react';

const ORGS = {
  glta:         { name: 'GLTA',          url: 'https://glta.tournamentsoftware.com/' },
  tennisCanada: { name: 'Tennis Canada',  url: 'https://tc.tournamentsoftware.com/' },
};

export default function MemberIdLabel({ org, small }) {
  const { name, url } = ORGS[org];
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span className={`form-label${small ? ' small' : ''} d-flex align-items-center gap-1 mb-1`}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-decoration-none"
        onClick={e => e.stopPropagation()}>{name}</a>
      {' '}Member ID
      <span ref={ref} style={{ position: 'relative', lineHeight: 1 }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: '#6c757d', fontSize: small ? '0.7rem' : '0.78rem',
            width: 16, height: 16, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid #6c757d', lineHeight: 1,
          }}
          aria-label="Help"
        >?</button>
        {open && (
          <div className="card shadow" style={{
            position: 'absolute', zIndex: 1080, width: 270,
            top: '130%', left: '50%', transform: 'translateX(-50%)',
            fontSize: '0.8rem',
          }}>
            <div className="card-body p-2">
              Go to{' '}
              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
              {' '}and search for your name. Your Member ID will appear in brackets beside your name.
            </div>
          </div>
        )}
      </span>
    </span>
  );
}
