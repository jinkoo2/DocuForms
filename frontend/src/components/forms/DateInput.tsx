import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

interface DateInputProps {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const DateInput: React.FC<DateInputProps> = ({
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
        type="date"
        value={value}
        onChange={handleChange}
        required={required}
        fullWidth
        variant="outlined"
        InputLabelProps={{
          shrink: true,
        }}
      />
    </Box>
  );
};

export default DateInput;

