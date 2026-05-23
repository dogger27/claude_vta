import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/config';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Title } from 'react-admin';

export default function MemberCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      setError('First name, last name, and email are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fn = httpsCallable(functions, 'createMemberAdmin');
      const { data } = await fn(form);
      setResetLink(data.resetLink);
    } catch (err) {
      setError(err.message || 'Failed to create member.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', p: 2 }}>
      <Title title="New Member" />

      {resetLink ? (
        <Card variant="outlined">
          <CardContent>
            <Alert severity="success" sx={{ mb: 3 }}>
              Account created for <strong>{form.firstName} {form.lastName}</strong>.
              Share the link below so they can set their password.
            </Alert>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Password setup link
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={resetLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={copyLink} edge="end" size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3, fontFamily: 'monospace' }}
            />
            {copied && <Typography variant="caption" color="success.main">Copied!</Typography>}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="contained" onClick={() => navigate('/admin/memberProfiles')}>
                Back to Members
              </Button>
              <Button variant="outlined" onClick={() => { setResetLink(''); setForm({ firstName: '', lastName: '', email: '' }); }}>
                Create Another
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 2 }}>
              New Member
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="First Name" value={form.firstName} onChange={set('firstName')} required fullWidth size="small" />
                <TextField label="Last Name" value={form.lastName} onChange={set('lastName')} required fullWidth size="small" />
              </Box>
              <TextField label="Email" type="email" value={form.email} onChange={set('email')} required fullWidth size="small" />
              <Typography variant="caption" color="text.secondary">
                The member will receive a password setup link after creation. Additional profile fields (phone, address, etc.) can be filled in after they log in.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creating…' : 'Create Member'}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/admin/memberProfiles')}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
