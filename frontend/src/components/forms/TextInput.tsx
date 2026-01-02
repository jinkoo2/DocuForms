import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

interface TextInputProps {
  id: string;
  label?: string;
  required?: boolean;
  multiline?: boolean;
  minRows?: number;
  value?: string;
  onChange?: (value: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  required = false,
  multiline = false,
  minRows,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const labelToUse = label ?? id;

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
        id={id}
        name={id}
        label={labelToUse}
        value={value}
        onChange={handleChange}
        required={required}
        multiline={multiline}
        minRows={minRows}
        fullWidth
        variant="outlined"
      />
    </Box>
  );
};

export default TextInput;

