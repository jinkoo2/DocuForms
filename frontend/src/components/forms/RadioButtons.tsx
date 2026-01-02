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
  default?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const RadioButtons: React.FC<RadioButtonsProps> = ({
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

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Evaluate initial/default or controlled value
  React.useEffect(() => {
    evaluateStatus(value);
  }, [value, correct]);

  const evaluateStatus = (val: string | undefined | null) => {
    if (!val || correct === undefined) {
      setStatus(null);
      return;
    }
    setStatus(val === correct ? 'pass' : 'fail');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    evaluateStatus(newValue);
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
                        : status === 'fail'
                          ? 'error'
                          : 'primary'
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

