import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          <h4 className="card-title mb-1">Vancouver Tennis Association</h4>
          <p className="text-muted mb-4">Member Portal</p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100">Sign In</button>
          </form>
          <p className="text-center mt-3 mb-0 small">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
