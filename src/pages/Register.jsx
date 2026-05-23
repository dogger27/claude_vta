import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import PostalCodeInput from '../components/PostalCodeInput';
import MemberIdLabel from '../components/MemberIdLabel';
import NtrpHelpIcon from '../components/NtrpHelpIcon';

const LEVELS = ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'];

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    phone: '', zipCode: '', level: '', gltaId: '', tennisCanadaId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (field === 'email') { setEmailTaken(false); setResetSent(false); }
  };

  const handleEmailBlur = async () => {
    const email = form.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmailChecking(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
      setEmailTaken(!snap.empty);
    } catch {
      // ignore — will be caught on submit if it's actually a problem
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSendReset = async () => {
    await sendPasswordResetEmail(auth, form.email.trim());
    setResetSent(true);
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())       e.firstName = 'Required';
    if (!form.lastName.trim())        e.lastName = 'Required';
    if (!form.email.trim())           e.email = 'Required';
    if (!form.password)               e.password = 'Required';
    if (!form.confirmPassword)        e.confirmPassword = 'Required';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone.trim())           e.phone = 'Required';
    if (!form.zipCode.trim())         e.zipCode = 'Required';
    if (!form.level)                  e.level = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;
      const now = serverTimestamp();

      await setDoc(doc(db, 'users', uid), {
        uid,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        isAdmin: false,
        createdAt: now,
      });

      await setDoc(doc(db, 'memberProfiles', uid), {
        userId: uid,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        zipCode: form.zipCode,
        level: parseFloat(form.level),
        gltaId: form.gltaId,
        tennisCanadaId: form.tennisCanadaId,
        membershipStart: null,
        membershipExpiry: null,
        paymentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      await addDoc(collection(db, 'memberships'), {
        userId: uid,
        membershipStart: null,
        membershipExpiry: null,
        paymentStatus: 'pending',
        amount: null,
        createdAt: now,
      });

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setEmailTaken(true);
      } else {
        setErrors({ submit: err.message });
      }
      setLoading(false);
    }
  };

  const f = (field) => errors[field]
    ? ' is-invalid'
    : '';

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '520px' }}>
        <div className="card-body p-4">
          <h4 className="card-title mb-1">Create Account</h4>
          <p className="text-muted mb-4">Vancouver Tennis Association</p>
          {errors.submit && <div className="alert alert-danger py-2">{errors.submit}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">First Name</label>
                <input className={`form-control${f('firstName')}`} value={form.firstName} onChange={set('firstName')} />
                {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
              </div>
              <div className="col-6">
                <label className="form-label">Last Name</label>
                <input className={`form-control${f('lastName')}`} value={form.lastName} onChange={set('lastName')} />
                {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Email</label>
                <div className="input-group">
                  <input type="email" className={`form-control${emailTaken ? ' is-invalid' : f('email')}`}
                    value={form.email} onChange={set('email')} onBlur={handleEmailBlur} />
                  {emailChecking && (
                    <span className="input-group-text">
                      <span className="spinner-border spinner-border-sm" role="status" />
                    </span>
                  )}
                </div>
                {errors.email && <div className="form-text text-danger">{errors.email}</div>}
                {emailTaken && (
                  <div className="mt-2 p-2 rounded border border-warning bg-warning bg-opacity-10" style={{ fontSize: '0.85rem' }}>
                    <p className="mb-1 fw-semibold">An account already exists for this email.</p>
                    {resetSent ? (
                      <span className="text-success">Reset email sent — check your inbox.</span>
                    ) : (
                      <div className="d-flex gap-2 flex-wrap">
                        <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleSendReset}>
                          Send password reset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="col-6">
                <label className="form-label">Password</label>
                <input type="password" className={`form-control${f('password')}`} value={form.password} onChange={set('password')} />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="col-6">
                <label className="form-label">Confirm Password</label>
                <input type="password" className={`form-control${f('confirmPassword')}`} value={form.confirmPassword} onChange={set('confirmPassword')} />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
              <div className="col-7">
                <label className="form-label">Phone</label>
                <input className={`form-control${f('phone')}`} value={form.phone} onChange={set('phone')} />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
              </div>
              <div className="col-5">
                <label className="form-label">Postal / Zip Code</label>
                <PostalCodeInput
                  value={form.zipCode}
                  onChange={val => setForm(f => ({ ...f, zipCode: val }))}
                />
                {errors.zipCode && <div className="form-text text-danger">{errors.zipCode}</div>}
              </div>
              <div className="col-6">
                <MemberIdLabel org="glta" />
                <input className="form-control" value={form.gltaId} onChange={set('gltaId')} />
              </div>
              <div className="col-6">
                <MemberIdLabel org="tennisCanada" />
                <input className="form-control" value={form.tennisCanadaId} onChange={set('tennisCanadaId')} />
              </div>
              <div className="col-12">
                <label className="form-label d-flex align-items-center gap-1">
                  Tennis Level (NTRP) <NtrpHelpIcon />
                </label>
                <select className={`form-select${f('level')}`} value={form.level} onChange={set('level')}>
                  <option value="">Select your level…</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {errors.level && <div className="invalid-feedback">{errors.level}</div>}
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
          <p className="text-center mt-3 mb-0 small">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
