import React from 'react';
import { mdxComponents } from '../components/editor/MDXComponents';

/**
 * Simple MDX parser that uses regex to find and replace MDX components
 * This is a lightweight runtime parser for MDX syntax
 */
export function parseMDXSimple(
  content: string,
  componentProps?: Record<string, any>
): React.ReactElement {
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
      const candidate = trimmed.startsWith('{')
        ? trimmed
        : `{${trimmed}}`;
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
  // Split content by MDX component patterns
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;

  // Pattern to match MDX components: <ComponentName prop="value" />
  const componentPattern = /<(\w+)([^>]*?)\/?>/g;
  let match;

  while ((match = componentPattern.exec(content)) !== null) {
    const [fullMatch, componentName, propsString] = match;
    const startIndex = match.index;

    // Add text before component
    if (startIndex > lastIndex) {
      const text = content.substring(lastIndex, startIndex);
      if (text.trim()) {
        parts.push(React.createElement('div', { key: `text-${lastIndex}` }, text));
      }
    }

    // Parse props from string with a small hand-rolled parser to support
    // bare props (boolean true) and balanced brace values (e.g. {{min:1,max:2}})
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

    // Get component from registry
    const Component = (mdxComponents as any)[componentName];
    if (Component) {
      // Merge with componentProps if provided (MDX props take precedence)
      const finalProps = { ...(componentProps || {}), ...props };
      parts.push(
        React.createElement(Component, {
          key: `component-${startIndex}`,
          ...finalProps,
        })
      );
    } else {
      // Unknown component, render as text
      parts.push(
        React.createElement('span', { key: `unknown-${startIndex}` }, fullMatch)
      );
    }

    lastIndex = componentPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const text = content.substring(lastIndex);
    if (text.trim()) {
      parts.push(React.createElement('div', { key: `text-${lastIndex}` }, text));
    }
  }

  return React.createElement(React.Fragment, {}, ...parts);
}
