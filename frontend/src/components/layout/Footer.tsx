import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

interface FooterProps {
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onSubmit, isSubmitting = false, isEditMode }) => {
  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        DocuForms v0.1.0
      </Typography>
      {onSubmit && !isEditMode && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Form'}
        </Button>
      )}
    </Box>
  );
};

export default Footer;

