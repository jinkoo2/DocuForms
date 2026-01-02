import React, { useState } from 'react';
import { TextField, Box, Chip } from '@mui/material';

interface Range {
  min: number;
  max: number;
}

interface NumberInputProps {
  label: string;
  required?: boolean;
  pass?: Range;
  warn?: Range;
  default?: number;
  value?: number;
  onChange?: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  required = false,
  pass,
  warn,
  default: defaultValueProp,
  value: controlledValue,
  onChange,
}) => {
  const [internalValue, setInternalValue] = useState<number | ''>(
    defaultValueProp ?? ''
  );
  const [status, setStatus] = useState<'pass' | 'warn' | 'fail' | null>(null);

  const resolvedValue =
    controlledValue !== undefined ? controlledValue : internalValue;
  const valueToRender =
    resolvedValue === undefined || resolvedValue === null
      ? ''
      : typeof resolvedValue === 'number' && Number.isNaN(resolvedValue)
        ? ''
        : resolvedValue;
  const isEmpty = valueToRender === '';
  const isErrorState = required && isEmpty;

  const normalizeRange = (range?: Range | string): Range | undefined => {
    if (!range) return undefined;

    // Accept stringified range values coming from loose MDX parsing like "{{min: 98, max: 102}}"
    if (typeof range === 'string') {
      let cleaned = range.trim();
      if (cleaned.startsWith('{{') && cleaned.endsWith('}}')) {
        cleaned = cleaned.slice(1, -1).trim();
      }
      if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
        cleaned = `${cleaned}}`;
      }
      const normalized = cleaned
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"');
      try {
        const parsed = JSON.parse(
          normalized.startsWith('{') ? normalized : `{${normalized}}`
        );
        return normalizeRange(parsed as Range);
      } catch {
        return undefined;
      }
    }

    const min = Number((range as Range).min);
    const max = Number((range as Range).max);
    if (Number.isNaN(min) || Number.isNaN(max)) return undefined;
    return { min, max };
  };

  const validateValue = (val: number) => {
    const passRange = normalizeRange(pass);
    const warnRange = normalizeRange(warn);

    if (Number.isNaN(val)) {
      setStatus(null);
      return;
    }

    if (passRange && val >= passRange.min && val <= passRange.max) {
      setStatus('pass');
    } else if (warnRange && val >= warnRange.min && val <= warnRange.max) {
      setStatus('warn');
    } else {
      setStatus('fail');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow full clear
    if (e.target.value === '') {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      setStatus(null);
      onChange?.(Number.NaN);
      return;
    }

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
      onChange?.(Number.NaN);
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

  const getStatusChip = () => {
    if (!status) return null;
    const color = status === 'pass' ? 'success' : status === 'warn' ? 'warning' : 'error';
    return <Chip label={status} color={color} size="small" variant="outlined" />;
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        sx={{ flex: 1 }}
        label={label}
        type="number"
        value={valueToRender}
        onChange={handleChange}
        required={required}
        error={isErrorState}
        color={isErrorState ? 'error' : getColor()}
        fullWidth
        variant="outlined"
      />
      {getStatusChip()}
    </Box>
  );
};

export default NumberInput;

