import { useState, useEffect, useCallback } from 'react';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { Title, useNotify } from 'react-admin';
import { db } from '../../../firebase/config';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

const CELL_SX = {
  border: '1px solid transparent',
  borderRadius: '3px',
  p: '3px 6px',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  bgcolor: 'transparent',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  '&:hover': { borderColor: '#bbb' },
  '&:focus': { borderColor: 'primary.main', bgcolor: '#fff' },
};

const formatDateTime = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const month   = d.toLocaleDateString('en-US', { month: 'short' });
  const day     = d.getDate();
  const year    = d.getFullYear();
  const time    = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                   .toLowerCase().replace(' ', '');
  return `${weekday} ${month} ${day} ${year}, ${time}`;
};

const DateTimeCell = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || '');
  useEffect(() => setLocal(value || ''), [value]);

  if (editing) {
    return (
      <Box
        component="input"
        type="datetime-local"
        value={local}
        autoFocus
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { setEditing(false); onSave(local); }}
        sx={{ ...CELL_SX, width: '100%' }}
      />
    );
  }
  return (
    <Box
      onClick={() => setEditing(true)}
      sx={{
        ...CELL_SX,
        display: 'block',
        cursor: 'text',
        whiteSpace: 'nowrap',
        color: local ? 'inherit' : 'text.disabled',
        minHeight: '1.5em',
      }}
    >
      {local ? formatDateTime(local) : 'Click to set…'}
    </Box>
  );
};

const SESSION_TYPES = ['', 'Winter', 'All Levels', 'Open/A/B Priority', 'C/D Priority'];

const Cell = ({ value, type = 'text', onSave, inputSx = {} }) => {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => setLocal(value ?? ''), [value]);
  return (
    <Box
      component="input"
      type={type}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => onSave(type === 'number' ? (local === '' ? null : Number(local)) : local)}
      sx={{ ...CELL_SX, ...inputSx }}
    />
  );
};

const SelectCell = ({ value, onSave }) => (
  <Box
    component="select"
    value={value || ''}
    onChange={e => onSave(e.target.value)}
    sx={{ ...CELL_SX, cursor: 'pointer', pr: 1 }}
  >
    {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
  </Box>
);

export default function PlaySessionList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'playSessions'), orderBy('dateTime', 'asc'));
        const snap = await getDocs(q);
        setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        const snap = await getDocs(collection(db, 'playSessions'));
        setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveField = useCallback(async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'playSessions', id), { [field]: value });
      setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    } catch {
      notify('Save failed', { type: 'error' });
    }
  }, [notify]);

  const addRow = async () => {
    const data = { dateTime: '', cancelled: false, numCourts: 6, location: '', type: '', manager: '', note: '', createdAt: serverTimestamp() };
    const ref = await addDoc(collection(db, 'playSessions'), data);
    setRows(prev => [...prev, { id: ref.id, ...data }]);
  };

  const deleteRow = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    await deleteDoc(doc(db, 'playSessions', id));
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const HEAD = ['DateTime', 'Cancelled', '# Courts', 'Location', 'Type', 'Manager', 'Note', ''];

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Title title="Play Sessions" />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              {HEAD.map((h, i) => (
                <TableCell key={i} sx={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 1,
                  width: h === 'DateTime' ? 210 :h === 'Cancelled' ? 90 : h === '# Courts' ? 110 :h === 'Type' ? 170 : h === '' ? 44 : h === 'Note' ? 'auto' : 130,
                }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.id}
                sx={{
                  bgcolor: row.cancelled ? 'rgba(211,47,47,0.04)' : idx % 2 === 0 ? '#fff' : '#fafafa',
                  '&:hover': { bgcolor: row.cancelled ? 'rgba(211,47,47,0.08)' : '#f0f4ff' },
                  opacity: row.cancelled ? 0.6 : 1,
                }}
              >
                {/* DateTime */}
                <TableCell sx={{ p: 0.5 }}>
                  <DateTimeCell
                    value={row.dateTime || ''}
                    onSave={v => saveField(row.id, 'dateTime', v)}
                  />
                </TableCell>

                {/* Cancelled */}
                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>
                  <Checkbox
                    size="small"
                    checked={!!row.cancelled}
                    onChange={e => saveField(row.id, 'cancelled', e.target.checked)}
                    sx={{ p: 0.25 }}
                  />
                </TableCell>

                {/* # Courts */}
                <TableCell sx={{ p: 0.5 }}>
                  <Cell
                    type="number"
                    value={row.numCourts ?? ''}
                    onSave={v => saveField(row.id, 'numCourts', v)}
                    inputSx={{ textAlign: 'center' }}
                  />
                </TableCell>

                {/* Location */}
                <TableCell sx={{ p: 0.5 }}>
                  <Cell value={row.location || ''} onSave={v => saveField(row.id, 'location', v)} />
                </TableCell>

                {/* Type */}
                <TableCell sx={{ p: 0.5 }}>
                  <SelectCell value={row.type || ''} onSave={v => saveField(row.id, 'type', v)} />
                </TableCell>

                {/* Manager, Note */}
                {['manager', 'note'].map(field => (
                  <TableCell key={field} sx={{ p: 0.5 }}>
                    <Cell value={row[field] || ''} onSave={v => saveField(row.id, field, v)} />
                  </TableCell>
                ))}

                {/* Delete */}
                <TableCell sx={{ p: 0.5, textAlign: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => deleteRow(row.id)}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {/* Empty state */}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                  No sessions yet. Click Add Row to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1.5 }}>
        <Button startIcon={<AddIcon />} onClick={addRow} variant="outlined" size="small">
          Add Row
        </Button>
      </Box>
    </Box>
  );
}
