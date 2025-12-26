import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
} from '@mui/material';

interface RadioButtonsProps {
  label: string;
  options: string[];
  correct?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const RadioButtons: React.FC<RadioButtonsProps> = ({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    if (correct !== undefined) {
      setStatus(newValue === correct ? 'pass' : 'fail');
    }

    onChange?.(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">{label}</FormLabel>
        <RadioGroup value={value} onChange={handleChange}>
          {options.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={
                <Radio
                  color={
                    correct !== undefined && value === option
                      ? status === 'pass'
                        ? 'success'
                        : 'error'
                      : 'primary'
                  }
                />
              }
              label={option}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

export default RadioButtons;

