import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
} from '@mui/material';

interface DropdownProps {
  label: string;
  options: string[];
  correct?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  correct,
  required = false,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [status, setStatus] = useState<'pass' | 'fail' | null>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: SelectChangeEvent) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    if (correct !== undefined) {
      setStatus(newValue === correct ? 'pass' : 'fail');
    }

    onChange?.(newValue);
  };

  const getColor = () => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={handleChange}
          required={required}
          color={getColor()}
          label={label}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default Dropdown;

