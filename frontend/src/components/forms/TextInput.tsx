import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

interface TextInputProps {
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({
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
        value={value}
        onChange={handleChange}
        required={required}
        fullWidth
        variant="outlined"
      />
    </Box>
  );
};

export default TextInput;

