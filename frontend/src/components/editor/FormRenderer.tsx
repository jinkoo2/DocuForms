import React from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mdxComponents } from './MDXComponents';

interface FormRendererProps {
  content: string;
  formAnswers: Record<string, any>;
  onFormAnswerChange: (answers: Record<string, any>) => void;
}

/**
 * Parse props string from MDX component
 */
function parseProps(propsString: string): Record<string, any> {
  const props: Record<string, any> = {};
  
  // Match prop patterns: name="value" or name={value}
  const propPattern = /(\w+)=(?:"([^"]*)"|{([^}]+)})/g;
  let match;
  
  while ((match = propPattern.exec(propsString)) !== null) {
    const [, name, stringValue, jsonValue] = match;
    let value: any = stringValue !== undefined ? stringValue : jsonValue;

    // Try to parse JSON values
    if (jsonValue !== undefined) {
      try {
        value = JSON.parse(jsonValue);
      } catch {
        // If not valid JSON, try to parse as array/object manually
        if (jsonValue.startsWith('[') && jsonValue.endsWith(']')) {
          try {
            value = JSON.parse(jsonValue);
          } catch {
            // Parse simple array: ["a", "b"]
            const items = jsonValue
              .slice(1, -1)
              .split(',')
              .map((item) => item.trim().replace(/^["']|["']$/g, ''));
            value = items;
          }
        } else if (jsonValue.startsWith('{') && jsonValue.endsWith('}')) {
          try {
            value = JSON.parse(jsonValue);
          } catch {
            // Parse simple object: {min: 1, max: 2}
            const obj: Record<string, any> = {};
            const pairs = jsonValue
              .slice(1, -1)
              .split(',')
              .map((pair) => pair.trim());
            pairs.forEach((pair) => {
              const [key, val] = pair.split(':').map((s) => s.trim());
              if (key && val) {
                obj[key] = isNaN(Number(val)) ? val : Number(val);
              }
            });
            value = obj;
          }
        }
      }
    }

    // Handle boolean strings
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    
    // Handle numbers
    if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
      value = Number(value);
    }

    props[name] = value;
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
}) => {
  const handleFieldChange = (fieldId: string, value: any) => {
    onFormAnswerChange({
      ...formAnswers,
      [fieldId]: value,
    });
  };

  const parts: React.ReactNode[] = [];
  const lines = content.split('\n');
  let currentMarkdown = '';
  let blockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains MDX component (self-closing or opening tag)
    const selfClosingMatch = line.match(/<(\w+)([^>]*?)\s*\/>/);
    const openingMatch = line.match(/<(\w+)([^>]*?)>/);
    
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
        parts.push(
          <Component
            key={`comp-${componentName}-${fieldKey}-${blockIndex}`}
            {...props}
            value={formAnswers[fieldKey]}
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
