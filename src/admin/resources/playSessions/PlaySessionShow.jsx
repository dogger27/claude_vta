import { Show, useRecordContext, EditButton, TopToolbar } from 'react-admin';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const ShowTitle = () => {
  const record = useRecordContext();
  if (!record?.dateTime) return <span>Play Session</span>;
  const d = new Date(record.dateTime);
  const label = isNaN(d.getTime()) ? record.dateTime
    : d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
  return <span>{label}</span>;
};

const ShowActions = () => (
  <TopToolbar><EditButton /></TopToolbar>
);

const Field = ({ label, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>{label}</Typography>
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

const PlaySessionShowContent = () => {
  const record = useRecordContext();
  if (!record) return null;

  const d = record.dateTime ? new Date(record.dateTime) : null;
  const dateLabel = d && !isNaN(d.getTime())
    ? d.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const timeLabel = d && !isNaN(d.getTime())
    ? d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>{dateLabel ?? record.dateTime}</Typography>
          {timeLabel && <Typography variant="body2" color="text.secondary">{timeLabel}</Typography>}
        </Box>
        {record.cancelled && (
          <Chip label="Cancelled" color="error" size="small" sx={{ ml: 'auto' }} />
        )}
      </Box>

      <Section title="Session Details">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="# Courts">{record.numCourts}</Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Location">{record.location}</Field>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Field label="Manager">{record.manager}</Field>
          </Grid>
        </Grid>
        {record.note && <Field label="Note">{record.note}</Field>}
      </Section>
    </Box>
  );
};

export default function PlaySessionShow() {
  return (
    <Show title={<ShowTitle />} actions={<ShowActions />}>
      <PlaySessionShowContent />
    </Show>
  );
}
