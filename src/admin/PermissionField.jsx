import { useState, useEffect } from 'react';
import { useRecordContext } from 'react-admin';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Chip } from '@mui/material';

export default function PermissionField({ label }) {
  const record = useRecordContext();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!record?.id) return;
    return onSnapshot(doc(db, 'users', record.id), snap => {
      setIsAdmin(snap.data()?.isAdmin === true);
    });
  }, [record?.id]);

  if (isAdmin === null) return null;
  return (
    <Chip
      label={isAdmin ? 'Admin' : 'Standard'}
      size="small"
      color={isAdmin ? 'primary' : 'default'}
      sx={{ cursor: 'default' }}
    />
  );
}
