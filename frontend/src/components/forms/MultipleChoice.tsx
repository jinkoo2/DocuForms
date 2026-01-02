import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material';

interface MultipleChoiceProps {
  id: string;
  label?: string;
  options: string[];
  correct?: string[];
  required?: boolean;
  default?: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  id,
  label,
  options,
  correct,
  required = false,
  default: defaultValueProp,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValueProp ?? []);
  const [status, setStatus] = useState<Record<string, 'pass' | 'fail'>>({});
  const labelToUse = label ?? id;

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const evaluateStatus = (vals: string[]) => {
    if (!correct) {
      setStatus({});
      return;
    }
    const next: Record<string, 'pass' | 'fail'> = {};
    vals.forEach((v) => {
      next[v] = correct.includes(v) ? 'pass' : 'fail';
    });
    setStatus(next);
  };

  useEffect(() => {
    evaluateStatus(value);
  }, [value, correct]);

  const handleChange = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option];

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    evaluateStatus(newValue);

    onChange?.(newValue);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">{labelToUse}</FormLabel>
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

