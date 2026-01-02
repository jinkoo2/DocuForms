export interface TreeNode {
  id: number;
  name: string;
  parent_id: number | null;
  children?: TreeNode[];
  documents?: Document[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  node_id: number;
  title: string;
  content: string; // MDX content
  version: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: number;
  document_id: number;
  user_id: string;
  answers: ControlAnswer[];
  submitted_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  groups: string[];
}

export interface FormFieldConfig {
  type: 'text' | 'number' | 'date' | 'time' | 'dropdown' | 'radio' | 'multiple';
  label: string;
  required?: boolean;
  pass?: { min: number; max: number };
  warn?: { min: number; max: number };
  options?: string[];
  correct?: string | string[];
}

export interface ControlAnswer {
  id: string;
  label: string;
  value: any;
  result: 'pass' | 'warning' | 'fail';
}

