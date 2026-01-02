import React, { useEffect, useMemo, useState } from 'react';
import { Box, TextField, Chip } from '@mui/material';

interface Range {
  min: number;
  max: number;
}

interface CalculateProps {
  id: string;
  label?: string;
  precision?: number;
  expression?: string;
  pass?: Range;
  warn?: Range;
  value?: number;
  onChange?: (value: number | null) => void;
  fieldKey?: string;
  // All form values passed from FormRenderer; used to read source fields
  values?: Record<string, any>;
}

const Calculate: React.FC<CalculateProps> = ({
  id,
  label,
  precision = 2,
  expression,
  pass,
  warn,
  value: controlledValue,
  onChange,
  fieldKey,
  values = {},
}) => {
  const [internalValue, setInternalValue] = useState<number | null>(null);
  const [status, setStatus] = useState<'pass' | 'warning' | 'fail' | null>(null);
  const labelToUse = label ?? id;

  const safeExpression = typeof expression === 'string' ? expression.trim() : '';

  const parsedVars = useMemo(() => {
    if (!safeExpression) return [];
    const matches = safeExpression.match(/[A-Za-z_]\w*/g) || [];
    return Array.from(new Set(matches.filter((v) => v !== 'Math')));
  }, [safeExpression]);

  const sourceKeys = useMemo(() => {
    const base = parsedVars.length > 0 ? parsedVars : [];
    return base.filter((k) => (fieldKey ? k !== fieldKey : true));
  }, [parsedVars, fieldKey]);

  const resolvedValue =
    controlledValue !== undefined ? controlledValue : internalValue;

  const normalizeRange = (range?: Range | string): Range | undefined => {
    if (!range) return undefined;
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

  const evaluateStatus = (val: number | null) => {
    const passRange = normalizeRange(pass);
    const warnRange = normalizeRange(warn);

    if (val === null || Number.isNaN(val)) {
      return null;
    }

    if (passRange && val >= passRange.min && val <= passRange.max) {
      return 'pass' as const;
    }
    if (warnRange && val >= warnRange.min && val <= warnRange.max) {
      return 'warning' as const;
    }
    return 'fail' as const;
  };

  const compute = () => {
    if (!safeExpression) {
      return { result: null, valid: false };
    }

    const nums = sourceKeys.map((key) => Number(values[key]));
    if (nums.some((n) => Number.isNaN(n))) {
      return { result: null, valid: false };
    }

    const sourceMap = Object.fromEntries(sourceKeys.map((k, i) => [k, nums[i]]));

    try {
      const fn = new Function(
        'Math',
        ...sourceKeys,
        `return ${safeExpression};`
      ) as (...args: any[]) => number;
      const res = fn(Math, ...sourceKeys.map((k) => sourceMap[k]!));
      if (Number.isNaN(res) || !Number.isFinite(res)) {
        return { result: null, valid: false };
      }

      const rounded = Number.isInteger(res)
        ? res
        : parseFloat(res.toFixed(precision));

      return { result: rounded, valid: true };
    } catch (e) {
      return { result: null, valid: false };
    }
  };

  const { result, valid } = compute();

  useEffect(() => {
    if (valid) {
      setInternalValue(result);
      setStatus(evaluateStatus(result));
      onChange?.(result as number);
    } else {
      setInternalValue(null);
      setStatus(evaluateStatus(null));
      onChange?.(null);
    }
  }, [result, valid, onChange, pass, warn]);

  const getStatusChip = () => {
    if (!pass || !status) return null;
    const color =
      status === 'pass'
        ? 'success'
        : status === 'warning'
          ? 'warning'
          : 'error';
    return <Chip label={status} color={color} size="small" variant="outlined" />;
  };

  const displayValue =
    resolvedValue === null || resolvedValue === undefined
      ? ''
      : resolvedValue.toString();

  const helperText =
    !safeExpression
      ? 'No expression provided'
      : !valid && sourceKeys.length > 0
        ? `Waiting for: ${sourceKeys
            .filter((k) => Number.isNaN(Number(values[k])))
            .join(', ')}`
        : `Expression: ${safeExpression}`;

  return (
    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        id={id}
        name={id}
        label={labelToUse}
        value={displayValue}
        InputProps={{ readOnly: true }}
        fullWidth
        color={valid ? 'success' : 'error'}
        variant="outlined"
        helperText={helperText}
        placeholder={safeExpression || 'Enter expression'}
      />
      {getStatusChip()}
    </Box>
  );
};

export default Calculate;

