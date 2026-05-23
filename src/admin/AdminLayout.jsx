import { useLocation, useNavigate } from 'react-router-dom';
import { Notification } from 'react-admin';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Toolbar from '@mui/material/Toolbar';
import AdminAppBar from './AdminAppBar';

const TABS = [
  { label: 'Members',       path: '/admin/memberProfiles' },
  { label: 'Programs',      path: '/admin/programs' },
  { label: 'Play Sessions', path: '/admin/playSessions' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = TABS.findIndex(t => location.pathname.startsWith(t.path));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <AdminAppBar />
      <Toolbar variant="dense" sx={{ minHeight: 48 }} />

      {/* Tab bar — matches Member Portal nav-tabs */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #dee2e6', position: 'sticky', top: 48, zIndex: 99 }}>
        <Tabs
          value={activeTab >= 0 ? activeTab : false}
          onChange={(_, i) => navigate(TABS[i].path)}
          TabIndicatorProps={{ style: { height: 3, backgroundColor: '#0d6efd' } }}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 400,
              color: '#666',
              px: 3,
            },
            '& .Mui-selected': {
              fontWeight: 600,
              color: '#212529',
            },
          }}
        >
          {TABS.map(t => <Tab key={t.path} label={t.label} disableRipple />)}
        </Tabs>
      </Box>

      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>

      <Notification />
    </Box>
  );
}
