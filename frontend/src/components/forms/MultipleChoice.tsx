import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material';

interface MultipleChoiceProps {
  label: string;
  options: string[];
  correct?: string[];
  required?: boolean;
  value?: string[];
  onChange?: (value: string[]) => void;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  label,
  options,
  correct,
  required = false,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState<string[]>([]);
  const [status, setStatus] = useState<Record<string, 'pass' | 'fail'>>({});

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    if (correct !== undefined) {
      const newStatus: Record<string, 'pass' | 'fail'> = {};
      newValue.forEach((v) => {
        newStatus[v] = correct.includes(v) ? 'pass' : 'fail';
      });
      setStatus(newStatus);
    }

    onChange?.(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">{label}</FormLabel>
        <FormGroup>
          {options.map((option) => (
            <FormControlLabel
              key={option}
              control={
                <Checkbox
                  checked={value.includes(option)}
                  onChange={() => handleChange(option)}
                  color={
                    correct !== undefined && value.includes(option)
                      ? status[option] === 'pass'
                        ? 'success'
                        : 'error'
                      : 'primary'
                  }
                />
              }
              label={option}
            />
          ))}
        </FormGroup>
      </FormControl>
    </Box>
  );
};

export default MultipleChoice;

