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
}) => {
  const latestAnswersRef = React.useRef<Record<string, any>>(formAnswers);

  React.useEffect(() => {
    latestAnswersRef.current = formAnswers;
  }, [formAnswers]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const next = { ...latestAnswersRef.current, [fieldId]: value };
    latestAnswersRef.current = next;
    onFormAnswerChange(next);
  };

  const parts: React.ReactNode[] = [];
  const lines = content.split('\n');
  let currentMarkdown = '';
  let blockIndex = 0;
  const requiredKeys: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Support multi-line component tags by buffering until we hit a ">"
    if (line.trim().startsWith('<') && !line.includes('>')) {
      let buffered = line;
      while (i + 1 < lines.length && !lines[i].includes('>')) {
        i += 1;
        buffered += '\n' + lines[i];
        if (lines[i].includes('>')) break;
      }
      line = buffered;
    }
    
    // Check if line contains MDX component (self-closing or opening tag)
    const selfClosingMatch = line.match(/<(\w+)([\s\S]*?)\s*\/>/);
    const openingMatch = line.match(/<(\w+)([\s\S]*?)>/);
    
    if (selfClosingMatch || openingMatch) {
      const match = selfClosingMatch || openingMatch;
      if (!match) continue;

      // Render accumulated markdown first
      if (currentMarkdown.trim()) {
        parts.push(
          <ReactMarkdown key={`md-${blockIndex}`} remarkPlugins={[remarkGfm]}>
            {currentMarkdown.trim()}
          </ReactMarkdown>
        );
        currentMarkdown = '';
        blockIndex += 1;
      }

      const [, componentName, propsString] = match;
      const Component = (mdxComponents as any)[componentName];

      if (Component) {
        const props = parseProps(propsString || '');
        const fieldKey =
          props.id || props.name || props.label || `${componentName}-${blockIndex}`;
        if (props.required) {
          requiredKeys.push(fieldKey);
        }
        parts.push(
          <Component
            key={`comp-${componentName}-${fieldKey}-${blockIndex}`}
            {...props}
            value={formAnswers[fieldKey]}
            values={formAnswers}
            fieldKey={fieldKey}
            onChange={(value: any) => handleFieldChange(fieldKey, value)}
          />
        );
        blockIndex += 1;
      } else {
        // Unknown component, render as text
        parts.push(
          <div key={`text-${blockIndex}`} style={{ color: 'red' }}>
            Unknown component: {componentName}
          </div>
        );
        blockIndex += 1;
      }
    } else {
      // Regular markdown line
      currentMarkdown += line + '\n';
    }
  }

  // Render remaining markdown
  if (currentMarkdown.trim()) {
    parts.push(
      <ReactMarkdown key={`md-${blockIndex}`} remarkPlugins={[remarkGfm]}>
        {currentMarkdown.trim()}
      </ReactMarkdown>
    );
  }

  React.useEffect(() => {
    if (onRequiredFieldsChange) {
      onRequiredFieldsChange(requiredKeys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, JSON.stringify(requiredKeys)]);

  return (
    <Box sx={{ p: 2 }}>
      {parts.length > 0 ? parts : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      )}
    </Box>
  );
};

export default FormRenderer;
