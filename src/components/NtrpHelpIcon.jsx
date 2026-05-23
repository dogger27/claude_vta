import { useState, useEffect, useRef } from 'react';

const SECTIONS = [
  {
    title: 'Beginner (1.0 – 2.5)',
    levels: [
      { range: '1.0 – 1.5', desc: 'Brand new to the sport. Focus is solely on learning basic strokes and keeping the ball in play.' },
      { range: '2.0',        desc: 'Needs on-court experience. Can sustain a slow-paced rally but struggles with consistency and optimal court positioning.' },
      { range: '2.5',        desc: 'Learning to judge where the ball is going and how much swing is needed. Can rally with players of the same ability but has limited court coverage.' },
    ],
  },
  {
    title: 'Intermediate (3.0 – 4.0)',
    levels: [
      { range: '3.0', desc: 'Fairly consistent when hitting medium-paced shots, but lacks directional control, depth, and variety.' },
      { range: '3.5', desc: 'Achieves stroke dependability and directional control on moderate shots, but still struggles to dictate play or handle a wide variety of paces.' },
      { range: '4.0', desc: 'Dependable strokes with good depth and directional control on both forehand and backhand sides. Can successfully use pace variations and construct points.' },
    ],
  },
  {
    title: 'Advanced (4.5 – 5.0)',
    levels: [
      { range: '4.5', desc: 'Has begun to master power and spin. Can control depth, move opponents, and change game plans based on the opponent\'s strengths and weaknesses.' },
      { range: '5.0', desc: 'Features highly developed skills, including dependable weapons, solid footwork, and tactical consistency. Equivalent to top-tier club or college-level play.' },
    ],
  },
];

export default function NtrpHelpIcon({ small }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', lineHeight: 1 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: '1.5px solid #6c757d', padding: 0, cursor: 'pointer',
          color: '#6c757d', fontSize: small ? '0.7rem' : '0.78rem',
          width: 16, height: 16, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
        }}
        aria-label="NTRP level guide"
      >?</button>

      {open && (
        <div className="card shadow" style={{
          position: 'absolute', zIndex: 1080, width: 320,
          top: '130%', left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.78rem', maxHeight: 380, overflowY: 'auto',
        }}>
          <div className="card-body p-3">
            <p className="fw-semibold mb-2">NTRP Self-Rating Guide</p>
            {SECTIONS.map(section => (
              <div key={section.title} className="mb-2">
                <p className="text-muted text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                  {section.title}
                </p>
                {section.levels.map(({ range, desc }) => (
                  <div key={range} className="mb-1">
                    <span className="fw-semibold">{range}</span> — {desc}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}
