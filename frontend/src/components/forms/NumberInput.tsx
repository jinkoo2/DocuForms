import React, { useState } from 'react';
import { TextField, Box, Chip } from '@mui/material';

interface Range {
  min: number;
  max: number;
}

type NumberValue =
  | number
  | {
      value: number | null;
      result?: 'pass' | 'warning' | 'fail' | null;
      label?: string;
    };

interface NumberInputProps {
  id: string;
  label?: string;
  required?: boolean;
  pass?: Range;
  warn?: Range;
  default?: number;
  value?: NumberValue;
  onChange?: (value: NumberValue) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
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
  const [status, setStatus] = useState<'pass' | 'warning' | 'fail' | null>(null);
  const labelToUse = label ?? id;

  const extractNumber = (val: NumberValue | number | '' | null | undefined): number | '' => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return '';
    if (typeof val === 'number') return Number.isNaN(val) ? '' : val;
    if (typeof val === 'object') {
      const num = val.value;
      if (num === null || num === undefined) return '';
      return Number.isNaN(num) ? '' : num;
    }
    return '';
  };

  const resolvedValue = extractNumber(
    controlledValue !== undefined ? controlledValue : internalValue
  );
  const valueToRender =
    resolvedValue === undefined || resolvedValue === null ? '' : resolvedValue;
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

  const getResultStatus = (val: number): 'pass' | 'warning' | 'fail' | null => {
    const passRange = normalizeRange(pass);
    const warnRange = normalizeRange(warn);

    if (Number.isNaN(val)) {
      return null;
    }

    if (passRange && val >= passRange.min && val <= passRange.max) {
      return 'pass';
    } else if (warnRange && val >= warnRange.min && val <= warnRange.max) {
      return 'warning';
    } else {
      return 'fail';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow full clear
    if (e.target.value === '') {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      setStatus(null);
      onChange?.({ value: null, result: null, label: labelToUse });
      return;
    }

    const numValue = parseFloat(e.target.value);

    if (!isNaN(numValue)) {
      if (controlledValue === undefined) {
        setInternalValue(numValue);
      }

      const computedStatus = getResultStatus(numValue);
      setStatus(computedStatus);
      onChange?.({
        value: numValue,
        result: computedStatus,
        label: labelToUse,
      });
    } else {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      setStatus(null);
      onChange?.({ value: null, result: null, label: labelToUse });
    }
  };

  // Sync status if we are controlled and status not derived from change
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      const num = extractNumber(controlledValue);
      const computedStatus =
        num === '' ? null : getResultStatus(typeof num === 'number' ? num : Number.NaN);
      setStatus(computedStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue, pass, warn]);

  const getColor = () => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'warning':
        return 'warning';
      case 'fail':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getStatusChip = () => {
    if (!status) return null;
    const color = status === 'pass' ? 'success' : status === 'warning' ? 'warning' : 'error';
    return <Chip label={status} color={color} size="small" variant="outlined" />;
  };

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        sx={{ flex: 1 }}
        id={id}
        name={id}
        label={labelToUse}
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

