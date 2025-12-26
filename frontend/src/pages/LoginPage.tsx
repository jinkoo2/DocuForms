import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      login();
    }
  }, [isLoading, login]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default LoginPage;

