import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

interface Range {
  min: number;
  max: number;
}

interface NumberInputProps {
  label: string;
  required?: boolean;
  pass?: Range;
  warn?: Range;
  value?: number;
  onChange?: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  required = false,
  pass,
  warn,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState<number | ''>('');
  const [status, setStatus] = useState<'pass' | 'warn' | 'fail' | null>(null);

  const value =
    controlledValue !== undefined ? controlledValue : internalValue;

  const validateValue = (val: number) => {
    if (pass && val >= pass.min && val <= pass.max) {
      setStatus('pass');
    } else if (warn && val >= warn.min && val <= warn.max) {
      setStatus('warn');
    } else {
      setStatus('fail');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      if (controlledValue === undefined) {
        setInternalValue(numValue);
      }
      validateValue(numValue);
      onChange?.(numValue);
    } else {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      setStatus(null);
    }
  };

  const getColor = () => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'warn':
        return 'warning';
      case 'fail':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label={label}
        type="number"
        value={value}
        onChange={handleChange}
        required={required}
        color={getColor()}
        fullWidth
        variant="outlined"
      />
    </Box>
  );
};

export default NumberInput;

