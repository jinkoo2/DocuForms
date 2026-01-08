import React from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mdxComponents } from './MDXComponents';

interface FormRendererProps {
  content: string;
  formAnswers: Record<string, any>;
  onFormAnswerChange: (answers: Record<string, any>) => void;
  onRequiredFieldsChange?: (required: string[]) => void;
  chartHistories?: Record<
    string,
    { submitted_at: string; value: number | null; result?: string | null }[]
  >;
  onChartRequest?: (fieldId: string, label: string) => void;
  documentId?: number | null;
}

/**
 * Parse props string from MDX component
 */
function parseProps(propsString: string): Record<string, any> {
  const parsePropValue = (raw: string): any => {
    const trimmed = raw.trim();

    // Try JSON first (works for numbers/booleans/arrays/objects when valid)
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }

    // Handle object-literal style values like {min: 1, max: 2}
    if (trimmed.includes(':')) {
      const candidate = trimmed.startsWith('{') ? trimmed : `{${trimmed}}`;
      const normalized = candidate
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"');
      try {
        return JSON.parse(normalized);
      } catch {
        // fall through
      }
    }

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (!isNaN(Number(trimmed))) return Number(trimmed);

    return raw;
  };

  const props: Record<string, any> = {};
  let idx = 0;
  const len = propsString.length;

  const skipSpaces = () => {
    while (idx < len && /\s/.test(propsString[idx]!)) idx++;
  };

  const readName = () => {
    const start = idx;
    while (idx < len && /[A-Za-z0-9_]/.test(propsString[idx]!)) idx++;
    return propsString.slice(start, idx);
  };

  const readQuoted = () => {
    idx++; // skip opening "
    let out = '';
    while (idx < len && propsString[idx] !== '"') {
      out += propsString[idx];
      idx++;
    }
    idx++; // skip closing "
    return out;
  };

  const readBraced = () => {
    idx++; // skip opening {
    let out = '';
    let depth = 1;
    while (idx < len && depth > 0) {
      const ch = propsString[idx]!;
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth > 0) out += ch;
      idx++;
    }
    return out;
  };

  while (idx < len) {
    skipSpaces();
    if (idx >= len) break;
    const name = readName();
    if (!name) break;
    skipSpaces();
    if (propsString[idx] === '=') {
      idx++; // skip =
      skipSpaces();
      const next = propsString[idx];
      if (next === '"') {
        const rawValue = readQuoted();
        props[name] = parsePropValue(rawValue);
      } else if (next === '{') {
        const rawValue = readBraced();
        props[name] = parsePropValue(rawValue);
      } else {
        // Fallback bare value
        const rawValue = readName();
        props[name] = parsePropValue(rawValue);
      }
    } else {
      // Bare prop => boolean true
      props[name] = true;
    }
  }

  return props;
}

/**
 * FormRenderer - Renders markdown content with embedded MDX form components
 */
const FormRenderer: React.FC<FormRendererProps> = ({
  content,
  formAnswers,
  onFormAnswerChange,
  onRequiredFieldsChange,
  chartHistories,
  onChartRequest,
  documentId,
}) => {
  const latestAnswersRef = React.useRef<Record<string, any>>(formAnswers);

  React.useEffect(() => {
    latestAnswersRef.current = formAnswers;
  }, [formAnswers]);

  const handleFieldChange = React.useCallback((fieldId: string, value: any) => {
    const next = { ...latestAnswersRef.current, [fieldId]: value };
    latestAnswersRef.current = next;
    onFormAnswerChange(next);
  }, [onFormAnswerChange]);

  // Extract required keys from content
  const requiredKeys = React.useMemo(() => {
    const keys: string[] = [];
    const componentPattern = /<(\w+)([\s\S]*?)(?:\s*\/>|>)/g;
    let match;
    
    while ((match = componentPattern.exec(content)) !== null) {
      const [, componentName, propsString] = match;
      const Component = (mdxComponents as any)[componentName];
      if (Component) {
        const props = parseProps(propsString || '');
        const fieldKey = props.id;
        if (fieldKey && props.required) {
          keys.push(fieldKey);
        }
      }
    }
    
    return keys;
  }, [content]);

  // Process content to replace MDX components with React components
  const processedContent = React.useMemo(() => {
    const componentPattern = /<(\w+)([\s\S]*?)(?:\s*\/>|>)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let componentIndex = 0;

    while ((match = componentPattern.exec(content)) !== null) {
      // Add text before component
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <ReactMarkdown key={`text-${componentIndex}`} remarkPlugins={[remarkGfm]}>
              {textBefore}
            </ReactMarkdown>
          );
        }
      }

      // Process component
      const [, componentName, propsString] = match;
      const Component = (mdxComponents as any)[componentName];
      
      if (Component) {
        const props = parseProps(propsString || '');
        const fieldKey = props.id;

        if (fieldKey) {
          const label = props.label || fieldKey;
          parts.push(
            <Component
              key={fieldKey}
              {...props}
              id={fieldKey}
              label={label}
              value={formAnswers[fieldKey]}
              values={formAnswers}
              fieldKey={fieldKey}
              onChange={(value: any) => handleFieldChange(fieldKey, value)}
              chartHistory={chartHistories ? chartHistories[fieldKey] : undefined}
              onChartRequest={onChartRequest}
              documentId={documentId}
            />
          );
        } else {
          parts.push(
            <div key={`missing-${componentIndex}`} style={{ color: 'red', display: 'inline-block' }}>
              Missing required id for component: {componentName}
            </div>
          );
        }
      } else {
        parts.push(
          <div key={`unknown-${componentIndex}`} style={{ color: 'red', display: 'inline-block' }}>
            Unknown component: {componentName}
          </div>
        );
      }

      lastIndex = match.index + match[0].length;
      componentIndex++;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      if (textAfter.trim()) {
        parts.push(
          <ReactMarkdown key="text-end" remarkPlugins={[remarkGfm]}>
            {textAfter}
          </ReactMarkdown>
        );
      }
    }

    return parts.length > 0 ? parts : null;
  }, [content, formAnswers, chartHistories, onChartRequest, documentId, handleFieldChange]);

  React.useEffect(() => {
    if (onRequiredFieldsChange) {
      onRequiredFieldsChange(requiredKeys);
    }
  }, [requiredKeys, onRequiredFieldsChange]);

  return (
    <Box sx={{ p: 2 }}>
      {processedContent || (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      )}
    </Box>
  );
};

export default FormRenderer;
