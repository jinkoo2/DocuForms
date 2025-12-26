import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

interface TimeInputProps {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({
  label,
  required = false,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState('');

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label={label}
        type="time"
        value={value}
        onChange={handleChange}
        required={required}
        fullWidth
        variant="outlined"
        InputLabelProps={{
          shrink: true,
        }}
        inputProps={{
          step: 1,
        }}
      />
    </Box>
  );
};

export default TimeInput;

