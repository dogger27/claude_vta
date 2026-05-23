import { useState, useEffect } from 'react';
import { Show, useRecordContext, EditButton, TopToolbar } from 'react-admin';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { formatPhone } from '../../../utils/phone';

const ShowTitle = () => {
  const record = useRecordContext();
  return <span>Member{record ? `: ${record.firstName} ${record.lastName}` : ''}</span>;
};

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
  </TopToolbar>
);

const Field = ({ label, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
      {label}
    </Typography>
    <Typography variant="body1">{children || '—'}</Typography>
  </Box>
);

const Section = ({ title, action, children }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {title}
        </Typography>
        {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
      </Box>
      {children}
    </CardContent>
  </Card>
);

const formatDate = (val) => {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

const MemberShowContent = () => {
  const record = useRecordContext();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!record?.id) return;
    getDoc(doc(db, 'users', record.id)).then(snap => {
      setIsAdmin(snap.data()?.isAdmin === true);
    });
  }, [record?.id]);

  if (!record) return null;

  const expiry = record.membershipExpiry ? new Date(record.membershipExpiry) : null;
  const isActive = expiry && expiry > new Date();

  const address = [
    [record.city, record.state].filter(Boolean).join(', '),
    record.zipCode,
  ].filter(Boolean).join('\n');

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', p: 2 }}>
      {/* Name header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            {record.firstName} {record.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">{record.email}</Typography>
        </Box>
        <Chip
          label={isAdmin ? 'Admin' : 'Standard'}
          color={isAdmin ? 'primary' : 'default'}
          size="small"
          title="Permission Group"
          sx={{ ml: 'auto', cursor: 'default' }}
        />
      </Box>

      <Grid container spacing={2}>
        {/* Personal */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Section title="Personal Information">
            <Field label="First Name">{record.firstName}</Field>
            <Field label="Last Name">{record.lastName}</Field>
            <Field label="Email">{record.email}</Field>
            <Field label="Phone">{formatPhone(record.phone)}</Field>
          </Section>
        </Grid>

        {/* Address */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Section title="Address">
            <Field label="City">{record.city}</Field>
            <Field label="Province / State">{record.state}</Field>
            <Field label="Postal / Zip Code">{record.zipCode}</Field>
          </Section>
        </Grid>

        {/* Membership */}
        <Grid size={{ xs: 12 }}>
          <Section
            title="Membership"
            action={
              <Chip
                label={isActive ? 'Active' : 'Inactive'}
                color={isActive ? 'success' : 'default'}
                size="small"
              />
            }
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Field label="Self-Rating NTRP">{record.level != null ? Number(record.level).toFixed(1) : null}</Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Field label="Start Date">{formatDate(record.membershipStart)}</Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Field label="Expiry Date">{formatDate(record.membershipExpiry)}</Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field label="GLTA Member ID">{record.gltaId || null}</Field>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field label="Tennis Canada Member ID">{record.tennisCanadaId || null}</Field>
              </Grid>
            </Grid>
          </Section>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function MemberShow() {
  return (
    <Show title={<ShowTitle />} actions={<ShowActions />}>
      <MemberShowContent />
    </Show>
  );
}
