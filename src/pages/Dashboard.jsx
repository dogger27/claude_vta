import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged, updateEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import { parsePhoneNumber, isValidPhoneNumber, getCountries, getCountryCallingCode, getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import { auth, db, functions, storage } from '../firebase/config';
import PostalCodeInput from '../components/PostalCodeInput';
import MemberIdLabel from '../components/MemberIdLabel';
import NtrpHelpIcon from '../components/NtrpHelpIcon';

// Build sorted country list with common countries pinned to top
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const PINNED = ['CA', 'US', 'GB', 'AU', 'NZ'];
const allCountries = getCountries()
  .map(code => ({ code, name: countryNames.of(code) ?? code, dialCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));
const COUNTRIES = [
  ...PINNED.map(code => allCountries.find(c => c.code === code)).filter(Boolean),
  null, // separator
  ...allCountries.filter(c => !PINNED.includes(c.code)),
];

const getMembershipActive = (profile) => {
  const expiry = profile?.membershipExpiry?.toDate?.();
  return profile?.paymentStatus === 'paid' && expiry && expiry > new Date();
};

const formatDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Stored as E.164. Legacy 10-digit values assumed Canadian.
const legacyToE164 = (stored) => {
  if (!stored) return '';
  if (stored.startsWith('+')) return stored;
  const digits = stored.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return stored;
};

const formatPhone = (stored) => {
  if (!stored) return '—';
  try {
    const parsed = parsePhoneNumber(legacyToE164(stored));
    return parsed?.isValid() ? parsed.formatInternational() : stored;
  } catch {
    return stored;
  }
};

const getExpectedDigits = (countryCode) => {
  try {
    const ex = getExampleNumber(countryCode, examples);
    return ex ? ex.nationalNumber.length : null;
  } catch {
    return null;
  }
};

const localPreview = (countryCode, localDigits) => {
  if (!localDigits || localDigits.length < 4) return null;
  try {
    const e164 = `+${getCountryCallingCode(countryCode)}${localDigits}`;
    const parsed = parsePhoneNumber(e164);
    return parsed?.isValid() ? parsed.formatInternational() : null;
  } catch {
    return null;
  }
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const navigate = useNavigate();

  const paymentStatus = new URLSearchParams(window.location.search).get('payment');
  const [activeTab, setActiveTab] = useState(paymentStatus ? 'membership' : 'profile');

  const handlePay = async () => {
    setPaying(true);
    try {
      const createSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createSession();
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert('Could not start checkout. Please try again.');
      setPaying(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const [userSnap, profileSnap, txSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'memberProfiles', user.uid)),
        getDocs(query(collection(db, 'memberships'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
      ]);
      const uData = userSnap.data();
      const pData = profileSnap.data();
      setUserData(uData);
      setProfile(pData);
      setPhotoURL(pData?.photoURL || null);
      setIsAdmin(uData?.isAdmin === true);
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const startEdit = () => {
    let phoneCountry = 'CA';
    let phoneLocal = '';
    const stored = profile?.phone || '';
    if (stored) {
      try {
        const parsed = parsePhoneNumber(legacyToE164(stored));
        if (parsed?.country) {
          phoneCountry = parsed.country;
          phoneLocal = parsed.nationalNumber;
        }
      } catch { /* leave defaults */ }
    }
    setForm({
      firstName:    userData?.firstName || '',
      lastName:     userData?.lastName  || '',
      email:        userData?.email     || '',
      phoneCountry,
      phone:        phoneLocal,
      city:         profile?.city    || '',
      state:        profile?.state   || '',
      zipCode:          profile?.zipCode       || '',
      level:            profile?.level         ?? '',
      gltaId:           profile?.gltaId        || '',
      tennisCanadaId:   profile?.tennisCanadaId || '',
    });
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    let phoneE164 = '';
    if (form.phone.trim()) {
      const e164 = `+${getCountryCallingCode(form.phoneCountry)}${form.phone}`;
      if (!isValidPhoneNumber(e164)) {
        const cName = countryNames.of(form.phoneCountry) ?? form.phoneCountry;
        setSaveError(`Please enter a valid ${cName} phone number.`);
        setSaving(false);
        return;
      }
      phoneE164 = parsePhoneNumber(e164).number;
    }

    try {
      const user = auth.currentUser;
      const promises = [
        updateDoc(doc(db, 'users', user.uid), {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim(),
        }),
        updateDoc(doc(db, 'memberProfiles', user.uid), {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim(),
          phone:     phoneE164,
          city:      form.city.trim(),
          state:     form.state.trim(),
          zipCode:          form.zipCode.trim(),
          level:            form.level === '' ? null : form.level,
          gltaId:           form.gltaId.trim(),
          tennisCanadaId:   form.tennisCanadaId.trim(),
        }),
      ];
      if (form.email.trim() !== user.email) {
        promises.push(updateEmail(user, form.email.trim()));
      }
      await Promise.all(promises);
      setUserData(u => ({ ...u, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() }));
      setProfile(p => ({ ...p, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: phoneE164, city: form.city.trim(), state: form.state.trim(), zipCode: form.zipCode.trim(), level: form.level === '' ? null : form.level, gltaId: form.gltaId.trim(), tennisCanadaId: form.tennisCanadaId.trim() }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.code === 'auth/requires-recent-login'
        ? 'Please sign out and sign back in before changing your email.'
        : 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = '';
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const getCroppedBlob = (imageSrc, pixelCrop) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', 0.95);
      };
      image.onerror = reject;
      image.src = imageSrc;
    });

  const handleCropApply = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setPhotoUploading(true);
    setCropSrc(null);
    try {
      const croppedBlob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      URL.revokeObjectURL(cropSrc);
      const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      const compressed = await imageCompression(croppedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
        fileType: 'image/jpeg',
        initialQuality: 0.9,
        useWebWorker: true,
      });
      const user = auth.currentUser;
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'memberProfiles', user.uid), { photoURL: url });
      setPhotoURL(url);
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Photo upload failed. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const initials = `${userData?.firstName?.[0] ?? ''}${userData?.lastName?.[0] ?? ''}`.toUpperCase();
  const memberName = `${userData?.firstName ?? ''} ${userData?.lastName ?? ''}`.trim();
  const isActive = profile ? getMembershipActive(profile) : false;

  return (
    <div className="min-vh-100 bg-light" onClick={() => setDropdownOpen(false)}>

      {/* ── Top Navbar ── */}
      <nav className="navbar navbar-dark bg-dark px-3 position-relative">
        <span className="navbar-brand fw-bold me-2">VTA</span>
        <span className="text-white-50 small d-none d-sm-inline me-auto">Vancouver Tennis Association</span>
        <span className="position-absolute top-50 start-50 translate-middle text-white fw-semibold d-none d-md-block" style={{ pointerEvents: 'none' }}>
          Member Portal
        </span>

        {/* Mobile hamburger */}
        <button
          className="navbar-toggler d-md-none border-0 me-2"
          onClick={e => { e.stopPropagation(); setNavOpen(o => !o); }}
          aria-label="Menu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Desktop user dropdown */}
        <div className="d-none d-md-block position-relative" onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
            onClick={() => setDropdownOpen(o => !o)}
          >
            {photoURL ? (
              <img src={photoURL} alt="" className="rounded-circle object-fit-cover" style={{ width: 24, height: 24 }} />
            ) : (
              <span className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center fw-bold"
                style={{ width: 24, height: 24, fontSize: 11 }}>{initials}</span>
            )}
            {memberName}
            <span style={{ fontSize: 10 }}>▾</span>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu dropdown-menu-end show shadow" style={{ minWidth: 180 }}>
              <span className="dropdown-item-text small text-muted">{isAdmin ? 'Admin' : 'Standard'} account</span>
              <div className="dropdown-divider" />
              {isAdmin && <a className="dropdown-item" href="/admin">Admin Panel</a>}
              <button className="dropdown-item text-danger" onClick={handleLogout}>Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {navOpen && (
        <div className="bg-dark text-white px-4 py-3 d-md-none border-top border-secondary">
          <div className="mb-2 small text-white-50">{memberName} · {isAdmin ? 'Admin' : 'Standard'}</div>
          {isAdmin && <a href="/admin" className="btn btn-warning btn-sm w-100 mb-2">Admin Panel</a>}
          <button className="btn btn-outline-light btn-sm w-100" onClick={handleLogout}>Sign Out</button>
        </div>
      )}

      {/* ── Member Hero ── */}
      <div className="bg-white border-bottom">
        <div className="container py-3" style={{ maxWidth: '760px' }}>
          <div className="d-flex align-items-center gap-3">

            {/* Avatar — click to enlarge if photo exists, otherwise open file picker */}
            <div className="position-relative flex-shrink-0" style={{ width: 128, height: 128 }}>
              {photoURL ? (
                <>
                  <img
                    src={photoURL}
                    alt="Profile"
                    className="rounded-circle object-fit-cover border"
                    style={{ width: 128, height: 128, cursor: 'zoom-in' }}
                    onClick={() => setLightboxOpen(true)}
                  />
                  {/* Camera overlay — change photo */}
                  <label
                    htmlFor="photo-upload"
                    className="position-absolute bottom-0 end-0 rounded-circle bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, cursor: 'pointer', border: '2px solid white' }}
                    title="Change photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="white" viewBox="0 0 16 16">
                      <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
                      <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
                    </svg>
                  </label>
                </>
              ) : (
                <label htmlFor="photo-upload" className="mb-0" style={{ cursor: 'pointer' }} title="Upload a photo">
                  <div className="rounded-circle bg-secondary text-white fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 128, height: 128, fontSize: 40 }}>
                    {photoUploading
                      ? <span className="spinner-border text-white" role="status" />
                      : (initials || '?')}
                  </div>
                </label>
              )}
              {photoUploading && photoURL && (
                <div className="position-absolute top-0 start-0 rounded-circle d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
                  style={{ width: 128, height: 128 }}>
                  <span className="spinner-border text-white" role="status" />
                </div>
              )}
            </div>

            <input id="photo-upload" type="file" accept="image/*" className="d-none" onChange={handlePhotoChange} />

            <div>
              <h5 className="mb-1 fw-semibold">{memberName || 'Loading…'}</h5>
              <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
                {isActive ? 'Active Member' : 'Inactive Member'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Crop Modal ── */}
      {cropSrc && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column" style={{ background: 'rgba(0,0,0,0.92)', zIndex: 1060 }}>
          <div className="text-white text-center pt-3 pb-1 small fw-semibold">Crop your photo</div>
          <div className="flex-grow-1 position-relative">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="d-flex flex-column align-items-center gap-2 py-3 px-4">
            <div className="d-flex align-items-center gap-2 w-100" style={{ maxWidth: 320 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 16 16">
                <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3"/>
              </svg>
              <input type="range" className="form-range flex-grow-1" min={1} max={3} step={0.01}
                value={zoom} onChange={e => setZoom(Number(e.target.value))} />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3"/>
              </svg>
            </div>
            <div className="d-flex gap-3">
              <button className="btn btn-secondary btn-sm px-4" onClick={handleCropCancel}>Cancel</button>
              <button className="btn btn-primary btn-sm px-4" onClick={handleCropApply}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox ── */}
      {lightboxOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1050, cursor: 'zoom-out' }}
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={photoURL}
            alt={memberName}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            className="position-absolute top-0 end-0 m-3 btn btn-dark btn-sm rounded-circle"
            style={{ width: 36, height: 36, fontSize: 18, lineHeight: 1 }}
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >×</button>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="bg-white border-bottom">
        <div className="container" style={{ maxWidth: '760px' }}>
          <ul className="nav nav-tabs border-0">
            {[
              { key: 'profile',     label: 'Profile' },
              { key: 'membership',  label: 'Membership' },
              { key: 'transactions', label: 'Transactions' },
            ].map(tab => (
              <li key={tab.key} className="nav-item">
                <button
                  className={`nav-link px-4${activeTab === tab.key ? ' active fw-semibold' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="container py-4" style={{ maxWidth: '760px' }}>
        {!profile ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-muted text-uppercase small mb-0">Personal Information</h6>
                    {!editing && (
                      <button className="btn btn-outline-secondary btn-sm" onClick={startEdit}>Edit</button>
                    )}
                  </div>

                  {saveError && <div className="alert alert-danger py-2 small">{saveError}</div>}

                  {editing ? (
                    <div>
                      <div className="row g-2 mb-2">
                        <div className="col-sm-6">
                          <label className="form-label small">First Name</label>
                          <input className="form-control form-control-sm" value={form.firstName}
                            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label small">Last Name</label>
                          <input className="form-control form-control-sm" value={form.lastName}
                            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small">Email</label>
                        <input type="email" className="form-control form-control-sm" value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small d-flex align-items-center gap-1">
                          Self-Rating NTRP <NtrpHelpIcon small />
                        </label>
                        <select className="form-select form-select-sm" value={form.level}
                          onChange={e => setForm(f => ({ ...f, level: e.target.value === '' ? '' : Number(e.target.value) }))}>
                          <option value="">Not set</option>
                          {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map(v => (
                            <option key={v} value={v}>{v.toFixed(1)}</option>
                          ))}
                        </select>
                      </div>
                      <hr className="my-3" />
                      <p className="text-muted text-uppercase small mb-2">Phone</p>
                      <div className="mb-2">
                        <label className="form-label small">Country Code</label>
                        <select className="form-select form-select-sm mb-1" value={form.phoneCountry}
                          onChange={e => setForm(f => ({ ...f, phoneCountry: e.target.value, phone: '' }))}>
                          {COUNTRIES.map((c, i) =>
                            c === null
                              ? <option key="sep" disabled>────────────────────</option>
                              : <option key={c.code} value={c.code}>{c.name} (+{c.dialCode})</option>
                          )}
                        </select>
                        <label className="form-label small">Phone Number</label>
                        {(() => {
                          const expected = getExpectedDigits(form.phoneCountry);
                          const preview = localPreview(form.phoneCountry, form.phone);
                          const remaining = expected ? expected - form.phone.length : null;
                          return (
                            <>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">+{getCountryCallingCode(form.phoneCountry)}</span>
                                <input
                                  className={`form-control${form.phone && !preview ? ' is-invalid' : preview ? ' is-valid' : ''}`}
                                  value={form.phone}
                                  onChange={e => {
                                    const digits = e.target.value.replace(/\D/g, '');
                                    setForm(f => ({ ...f, phone: expected ? digits.slice(0, expected) : digits }));
                                  }}
                                  placeholder={expected ? `${expected} digits` : 'local number'}
                                  inputMode="numeric"
                                  maxLength={expected ?? undefined}
                                />
                              </div>
                              {preview
                                ? <div className="form-text text-success">✓ {preview}</div>
                                : expected && !form.phone
                                  ? <div className="form-text text-muted">Please enter {expected} digits</div>
                                  : expected && remaining > 0
                                    ? <div className="form-text text-muted">{remaining} more digit{remaining !== 1 ? 's' : ''} needed</div>
                                    : null}
                            </>
                          );
                        })()}
                      </div>
                      <hr className="my-3" />
                      <p className="text-muted text-uppercase small mb-2">Address</p>
                      <div className="row g-2 mb-3">
                        <div className="col-sm-5">
                          <label className="form-label small">City</label>
                          <input className="form-control form-control-sm" value={form.city}
                            onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                        </div>
                        <div className="col-sm-3">
                          <label className="form-label small">Province / State</label>
                          <input className="form-control form-control-sm" value={form.state}
                            onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                        </div>
                        <div className="col-sm-4">
                          <label className="form-label small">Postal / Zip Code</label>
                          <PostalCodeInput
                            value={form.zipCode}
                            onChange={val => setForm(f => ({ ...f, zipCode: val }))}
                            inputClassName="form-control form-control-sm"
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                          {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)} disabled={saving}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Name</dt>
                      <dd className="col-sm-8">{userData?.firstName} {userData?.lastName}</dd>
                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8">{userData?.email}</dd>
                      <dt className="col-sm-4">Phone</dt>
                      <dd className="col-sm-8">{formatPhone(profile.phone)}</dd>
                      <dt className="col-sm-4">Address</dt>
                      <dd className="col-sm-8">
                        {profile.city
                          ? <>{profile.city}, {profile.state} {profile.zipCode}</>
                          : '—'}
                      </dd>
                      <dt className="col-sm-4 d-flex align-items-center gap-1">Self-Rating NTRP <NtrpHelpIcon small /></dt>
                      <dd className="col-sm-8">{profile.level != null ? Number(profile.level).toFixed(1) : '—'}</dd>
                    </dl>
                  )}
                </div>
              </div>
            )}

            {/* Membership Tab */}
            {activeTab === 'membership' && (
              <div className="card">
                <div className="card-body">
                  <h6 className="text-muted text-uppercase small mb-3">Membership Status</h6>

                  {paymentStatus === 'success' && (
                    <div className="alert alert-success py-2 small mb-3">
                      Payment successful — your membership is now active!
                    </div>
                  )}
                  {paymentStatus === 'cancelled' && (
                    <div className="alert alert-warning py-2 small mb-3">
                      Payment cancelled. You can try again below.
                    </div>
                  )}

                  <dl className="row mb-4">
                    <dt className="col-sm-4">Status</dt>
                    <dd className="col-sm-8">
                      {isActive
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-secondary">Inactive</span>}
                    </dd>
                    <dt className="col-sm-4">Start Date</dt>
                    <dd className="col-sm-8">{formatDate(profile.membershipStart)}</dd>
                    <dt className="col-sm-4">Expiry Date</dt>
                    <dd className="col-sm-8">{formatDate(profile.membershipExpiry)}</dd>
                    <dt className="col-sm-4"><MemberIdLabel org="glta" small /></dt>
                    <dd className="col-sm-8">
                      {editing ? (
                        <input className="form-control form-control-sm" value={form.gltaId}
                          onChange={e => setForm(f => ({ ...f, gltaId: e.target.value }))} />
                      ) : (profile.gltaId || '—')}
                    </dd>
                    <dt className="col-sm-4"><MemberIdLabel org="tennisCanada" small /></dt>
                    <dd className="col-sm-8">
                      {editing ? (
                        <input className="form-control form-control-sm" value={form.tennisCanadaId}
                          onChange={e => setForm(f => ({ ...f, tennisCanadaId: e.target.value }))} />
                      ) : (profile.tennisCanadaId || '—')}
                    </dd>
                  </dl>

                  {editing && (
                    <div className="d-flex gap-2 mb-3">
                      <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)} disabled={saving}>
                        Cancel
                      </button>
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={handlePay} disabled={paying}>
                    {paying ? 'Redirecting…' : isActive ? 'Renew Membership' : 'Pay Membership'}
                  </button>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="card">
                <div className="card-body">
                  <h6 className="text-muted text-uppercase small mb-3">Transaction History</h6>
                  {transactions.length === 0 ? (
                    <p className="text-muted mb-0">No transactions yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Period</th>
                            <th className="text-end">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(tx => (
                            <tr key={tx.id}>
                              <td className="text-nowrap">{formatDate(tx.createdAt)}</td>
                              <td>Annual Membership</td>
                              <td className="text-nowrap">
                                {formatDate(tx.membershipStart)} – {formatDate(tx.membershipExpiry)}
                              </td>
                              <td className="text-end text-nowrap">
                                {tx.amount != null ? `$${Number(tx.amount).toFixed(2)} CAD` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
