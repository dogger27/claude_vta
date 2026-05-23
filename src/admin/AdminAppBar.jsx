import { useState } from 'react';
import { AppBar, useGetIdentity, useLogout } from 'react-admin';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

const CustomUserMenu = () => {
  const { identity } = useGetIdentity();
  const logout = useLogout();
  const [anchorEl, setAnchorEl] = useState(null);

  const initials = identity?.fullName
    ? identity.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <>
      <Button
        color="inherit"
        size="small"
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'none', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 1, px: 1.5 }}
      >
        {identity?.avatar ? (
          <Box component="img" src={identity.avatar} alt=""
            sx={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
            {initials}
          </Box>
        )}
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
          {identity?.fullName ?? ''}
        </Typography>
        <Typography sx={{ color: 'white', fontSize: 10 }}>▾</Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { minWidth: 180, mt: 0.5 } } }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1, cursor: 'default' }}>
          Admin account
        </Typography>
        <Divider />
        <MenuItem component="a" href="/dashboard" onClick={() => setAnchorEl(null)}>
          Member Portal
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: 'error.main' }}>
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
};

export default function AdminAppBar() {
  return (
    <AppBar
      userMenu={false}
      sx={{ bgcolor: '#212529', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', lineHeight: 1 }}>
          VTA
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', display: { xs: 'none', sm: 'block' } }}>
          Vancouver Tennis Association
        </Typography>
      </Box>
      <Typography
        variant="subtitle1"
        sx={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          color: 'white', fontWeight: 600, pointerEvents: 'none',
          display: { xs: 'none', md: 'block' },
        }}
      >
        Admin Panel
      </Typography>
      <CustomUserMenu />
    </AppBar>
  );
}
