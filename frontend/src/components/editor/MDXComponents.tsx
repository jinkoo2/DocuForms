import React from 'react';
import TextInput from '../forms/TextInput';
import NumberInput from '../forms/NumberInput';
import Dropdown from '../forms/Dropdown';
import RadioButtons from '../forms/RadioButtons';
import MultipleChoice from '../forms/MultipleChoice';
import DateInput from '../forms/DateInput';
import TimeInput from '../forms/TimeInput';
import Calculate from '../forms/Calculate';

/**
 * MDX Component Registry
 * Maps component names to actual React components for use in MDX
 */
export const mdxComponents = {
  TextInput,
  NumberInput,
  Dropdown,
  RadioButtons,
  MultipleChoice,
  DateInput,
  TimeInput,
  Calculate,
  // Standard HTML elements
  h1: (props: any) => <h1 {...props} />,
  h2: (props: any) => <h2 {...props} />,
  h3: (props: any) => <h3 {...props} />,
  h4: (props: any) => <h4 {...props} />,
  h5: (props: any) => <h5 {...props} />,
  h6: (props: any) => <h6 {...props} />,
  p: (props: any) => <p {...props} />,
  ul: (props: any) => <ul {...props} />,
  ol: (props: any) => <ol {...props} />,
  li: (props: any) => <li {...props} />,
  blockquote: (props: any) => <blockquote {...props} />,
  code: (props: any) => <code {...props} />,
  pre: (props: any) => <pre {...props} />,
  a: (props: any) => <a {...props} />,
  strong: (props: any) => <strong {...props} />,
  em: (props: any) => <em {...props} />,
  hr: (props: any) => <hr {...props} />,
  table: (props: any) => <table {...props} />,
  thead: (props: any) => <thead {...props} />,
  tbody: (props: any) => <tbody {...props} />,
  tr: (props: any) => <tr {...props} />,
  td: (props: any) => <td {...props} />,
  th: (props: any) => <th {...props} />,
};

export type MDXComponentsType = typeof mdxComponents;

