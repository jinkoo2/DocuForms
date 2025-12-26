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

    // Parse props from string
    const props: Record<string, any> = {};
    const propPattern = /(\w+)={([^}]+)}|(\w+)="([^"]+)"/g;
    let propMatch;
    while ((propMatch = propPattern.exec(propsString)) !== null) {
      const [, propName, propValueJson, propName2, propValueString] = propMatch;
      const name = propName || propName2;
      let value: any = propValueString || propValueJson;

      // Try to parse JSON values
      if (propValueJson) {
        try {
          value = JSON.parse(propValueJson);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      // Handle special cases
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (!isNaN(Number(value))) value = Number(value);

      props[name] = value;
    }

    // Get component from registry
    const Component = (mdxComponents as any)[componentName];
    if (Component) {
      // Merge with componentProps if provided
      const finalProps = { ...props, ...(componentProps || {}) };
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
