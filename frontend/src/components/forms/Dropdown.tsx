import React, { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
  Chip,
} from '@mui/material';

interface DropdownProps {
  id: string;
  label?: string;
  options: string[];
  correct?: string;
  required?: boolean;
  default?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  id,
  label,
  options,
  correct,
  required = false,
  default: defaultValueProp,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValueProp ?? '');
  const [status, setStatus] = useState<'pass' | 'fail' | null>(null);
  const labelToUse = label ?? id;

  const resolvedValue =
    controlledValue !== undefined ? controlledValue : internalValue;
  const valueToRender =
    resolvedValue === undefined || resolvedValue === null ? '' : resolvedValue;
  const isEmpty = valueToRender === '';
  const isErrorState = required && isEmpty;
  const isFailState = status === 'fail';

  // Evaluate initial/updated value against correct answer
  useEffect(() => {
    if (valueToRender === '') {
      setStatus(null);
      return;
    }
    if (correct !== undefined) {
      setStatus(valueToRender === correct ? 'pass' : 'fail');
    } else {
      setStatus(null);
    }
  }, [valueToRender, correct]);

  const handleChange = (e: SelectChangeEvent) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    if (correct !== undefined && newValue !== '') {
      setStatus(newValue === correct ? 'pass' : 'fail');
    } else {
      setStatus(null);
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

  const getStatusChip = () => {
    if (!status) return null;
    const color = status === 'pass' ? 'success' : 'error';
    return <Chip label={status} color={color} size="small" variant="outlined" />;
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControl fullWidth error={isErrorState || isFailState} sx={{ flex: 1 }}>
        <InputLabel color={isErrorState || isFailState ? 'error' : 'primary'}>{labelToUse}</InputLabel>
        <Select
          id={id}
          name={id}
          value={valueToRender}
          onChange={handleChange}
          required={required}
          color={isErrorState || isFailState ? 'error' : getColor()}
          label={labelToUse}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {getStatusChip()}
    </Box>
  );
};

export default Dropdown;

