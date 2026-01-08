import React, { useState, useEffect, useMemo } from 'react';
import { TextField, Box, Chip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { submissionsApi } from '../../services/api';
import { FormSubmission } from '../../types';

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

interface DifferenceFromReferenceProps {
  id: string;
  label?: string;
  required?: boolean;
  pass?: Range;
  warn?: Range;
  default?: number;
  value?: NumberValue;
  onChange?: (value: NumberValue) => void;
  documentId?: number | null;
  mode?: 'absolute' | 'relative'; // Calculation mode
  precision?: number; // Decimal precision for difference display
  chartHistory?: { submitted_at: string; value: number | null; result?: string | null }[];
  onChartRequest?: (fieldId: string, label: string) => void;
  width?: string | number; // Width of the input (e.g., "100px", "50%", or number for pixels)
}

const DifferenceFromReference: React.FC<DifferenceFromReferenceProps> = ({
  id,
  label,
  required = false,
  pass,
  warn,
  default: defaultValueProp,
  value: controlledValue,
  onChange,
  documentId,
  mode = 'absolute',
  precision = 2,
  chartHistory,
  onChartRequest,
  width,
}) => {
  const [internalValue, setInternalValue] = useState<number | ''>(
    defaultValueProp ?? ''
  );
  const [status, setStatus] = useState<'pass' | 'warning' | 'fail' | null>(null);
  const labelToUse = label ?? id;

  // Fetch submissions to find reference
  const { data: submissionsData } = useQuery<FormSubmission[]>({
    queryKey: ['submissions', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const res = await submissionsApi.getAll(documentId);
      return res.data;
    },
    enabled: !!documentId,
  });

  // Find reference submission
  const referenceSubmission = useMemo(() => {
    if (!submissionsData) return null;
    return submissionsData.find((sub) => sub.is_reference === true) || null;
  }, [submissionsData]);

  // Get reference value for this field
  const referenceValue = useMemo(() => {
    if (!referenceSubmission || !Array.isArray(referenceSubmission.answers)) return null;
    const answer = referenceSubmission.answers.find(
      (ans: any) => ans && String(ans.id) === String(id)
    );
    if (!answer) return null;
    const val = answer.value;
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && !Number.isNaN(Number(val))) return Number(val);
    return null;
  }, [referenceSubmission, id]);

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

  // Get the input value for this field
  const inputValue = useMemo(() => {
    const resolved = extractNumber(controlledValue !== undefined ? controlledValue : internalValue);
    return resolved === '' ? null : (typeof resolved === 'number' ? resolved : null);
  }, [controlledValue, internalValue]);

  // Calculate difference
  const difference = useMemo(() => {
    if (inputValue === null || referenceValue === null) return null;
    
    if (mode === 'absolute') {
      return inputValue - referenceValue;
    } else {
      // Relative mode: ((input - reference) / reference) * 100
      if (referenceValue === 0) return null; // Can't divide by zero
      return ((inputValue - referenceValue) / referenceValue) * 100.0;
    }
  }, [inputValue, referenceValue, mode]);

  const resolvedValue = extractNumber(
    controlledValue !== undefined ? controlledValue : internalValue
  );
  const valueToRender =
    resolvedValue === undefined || resolvedValue === null ? '' : resolvedValue;
  const isEmpty = valueToRender === '';
  const isErrorState = required && isEmpty;

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

      // Calculate difference for status evaluation
      let computedStatus: 'pass' | 'warning' | 'fail' | null = null;
      if (referenceValue !== null) {
        let diff: number | null = null;
        if (mode === 'absolute') {
          diff = numValue - referenceValue;
        } else {
          // Relative mode
          if (referenceValue !== 0) {
            diff = ((numValue - referenceValue) / referenceValue) * 100.0;
          }
        }
        if (diff !== null) {
          computedStatus = getResultStatus(diff);
        }
      } else {
        // No reference value - set to pass
        computedStatus = 'pass';
      }

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

  // Sync status based on difference when input or reference changes
  useEffect(() => {
    if (inputValue === null) {
      setStatus(null);
      return;
    }

    // If no reference value, set to pass
    if (referenceValue === null) {
      setStatus('pass');
      // Update onChange if controlled
      if (controlledValue !== undefined && onChange) {
        const num = extractNumber(controlledValue);
        if (num !== '' && typeof num === 'number') {
          onChange({
            value: num,
            result: 'pass',
            label: labelToUse,
          });
        }
      }
      return;
    }

    // Calculate difference and evaluate status
    let diff: number | null = null;
    if (mode === 'absolute') {
      diff = inputValue - referenceValue;
    } else {
      // Relative mode
      if (referenceValue !== 0) {
        diff = ((inputValue - referenceValue) / referenceValue) * 100.0;
      }
    }

    if (diff !== null) {
      const computedStatus = getResultStatus(diff);
      setStatus(computedStatus);
      // Update onChange if controlled
      if (controlledValue !== undefined && onChange) {
        const num = extractNumber(controlledValue);
        if (num !== '' && typeof num === 'number') {
          onChange({
            value: num,
            result: computedStatus,
            label: labelToUse,
          });
        }
      }
    } else {
      setStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, referenceValue, mode, pass, warn]);

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

  const formatDifference = (diff: number | null): string => {
    if (diff === null) return '—';
    if (mode === 'relative') {
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(precision)}%`;
    }
    return diff.toFixed(precision);
  };

  // Convert width to CSS value
  const widthStyle = width !== undefined 
    ? typeof width === 'number' 
      ? `${width}px` 
      : width
    : undefined;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <TextField
          sx={{ 
            ...(width !== undefined ? { width: widthStyle, flex: 'none' } : { flex: 1 })
          }}
          id={id}
          name={id}
          label={labelToUse}
          type="number"
          value={valueToRender}
          onChange={handleChange}
          required={required}
          error={isErrorState}
          color={isErrorState ? 'error' : getColor()}
          fullWidth={width === undefined}
          variant="outlined"
        />
        {getStatusChip()}
        {onChartRequest && chartHistory && chartHistory.length > 0 && (
          <Chip
            label="View chart"
            size="small"
            variant="outlined"
            onClick={() => onChartRequest(id, labelToUse)}
          />
        )}
      </Box>

      {/* Reference value and difference display */}
      <Box sx={{ mt: 1 }}>
        {referenceValue === null ? (
          <Typography variant="body2" color="text.secondary">
            No reference submission available
          </Typography>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Reference value: {referenceValue.toFixed(precision)}
            </Typography>
            {inputValue !== null ? (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: difference !== null && Math.abs(difference) > 0 ? 'warning.main' : 'text.primary'
                }}
              >
                Difference: {formatDifference(difference)}
                {mode === 'relative' && ' (percent)'}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Enter a value to calculate difference
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DifferenceFromReference;
