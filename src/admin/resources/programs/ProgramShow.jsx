import { Show, useRecordContext, EditButton, TopToolbar } from 'react-admin';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const ShowTitle = () => {
  const record = useRecordContext();
  return <span>{record?.name ?? 'Program'}</span>;
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
    <Typography variant="body1">{children ?? '—'}</Typography>
  </Box>
);

const Section = ({ title, children }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, display: 'block', mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const formatDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (val) =>
  val != null ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val) : null;

const ProgramShowContent = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>{record.name}</Typography>
      </Box>

      <Section title="Details">
        <Field label="Description">{record.description}</Field>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Start Date">{formatDate(record.startDate)}</Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="End Date">{formatDate(record.endDate)}</Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Fee">{formatCurrency(record.fee)}</Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Max Participants">{record.maxParticipants}</Field>
          </Grid>
        </Grid>
      </Section>
    </Box>
  );
};

export default function ProgramShow() {
  return (
    <Show title={<ShowTitle />} actions={<ShowActions />}>
      <ProgramShowContent />
    </Show>
  );
}
