# MDX Integration Guide

## Overview

The DocuForms application now supports MDX (Markdown + JSX) syntax, allowing you to embed React form components directly in markdown documents.

## How It Works

The MDX integration uses a runtime parser that:
1. Parses markdown content line by line
2. Detects MDX component syntax (e.g., `<TextInput />`)
3. Extracts component props and renders the appropriate React component
4. Renders regular markdown content using ReactMarkdown

## Available Form Components

### TextInput
```mdx
<TextInput label="Patient Name" required />
```

### NumberInput
```mdx
<NumberInput
  label="Dose (Gy)"
  pass={{min: 1.9, max: 2.1}}
  warn={{min: 1.8, max: 2.2}}
/>
```

### Dropdown
```mdx
<Dropdown
  label="Machine"
  options={["Linac A", "Linac B"]}
  correct="Linac A"
/>
```

### RadioButtons
```mdx
<RadioButtons
  label="Status"
  options={["Active", "Inactive"]}
  correct="Active"
/>
```

### MultipleChoice
```mdx
<MultipleChoice
  label="Symptoms"
  options={["Fever", "Cough", "Headache"]}
  correct={["Fever", "Cough"]}
/>
```

### DateInput
```mdx
<DateInput label="Date" required />
```

### TimeInput
```mdx
<TimeInput label="Time" required />
```

## Example Form

```mdx
# Daily QA Form

## Patient Info

<TextInput label="Patient Name" required />

<NumberInput
  label="Dose (Gy)"
  pass={{min: 1.9, max: 2.1}}
  warn={{min: 1.8, max: 2.2}}
/>

<Dropdown
  label="Machine"
  options={["Linac A", "Linac B"]}
  correct="Linac A"
/>

## Notes

Additional notes can be added using regular markdown.
```

## Component Props

### Common Props
- `label` (string, required): The label displayed for the form field
- `required` (boolean, optional): Whether the field is required

### NumberInput Specific Props
- `pass` (object, optional): Range for pass status `{min: number, max: number}`
- `warn` (object, optional): Range for warning status `{min: number, max: number}`

### Dropdown/RadioButtons/MultipleChoice Props
- `options` (array, required): Array of option strings
- `correct` (string | array, optional): Correct answer(s) for validation

## Validation

Form components automatically validate based on their props:

- **NumberInput**: Changes color based on pass/warn/fail ranges
  - Green: Value within `pass` range
  - Yellow: Value within `warn` range
  - Red: Value outside both ranges

- **Dropdown/RadioButtons**: Changes color based on correct answer
  - Green: Selected value matches `correct`
  - Red: Selected value doesn't match `correct`

- **MultipleChoice**: Each option changes color individually
  - Green: Option is selected and in `correct` array
  - Red: Option is selected but not in `correct` array

## Technical Details

### Architecture

1. **MDXComponents.tsx**: Component registry mapping component names to React components
2. **FormRenderer.tsx**: Main renderer that processes MDX content and renders components
3. **mdxParser.tsx**: Utility for parsing MDX syntax (currently using simple regex-based approach)

### Limitations

- Currently uses a simple regex-based parser (not full MDX compiler)
- Multi-line component props are not fully supported
- Complex JSX expressions may not parse correctly
- For production, consider using a build-time MDX compiler

### Future Improvements

- Full MDX compiler integration with webpack/parcel
- Support for nested components
- Better error handling and validation
- Syntax highlighting in editor
- Component autocomplete

## Usage in Editor

1. Open a document in edit mode
2. Use the "Component Examples" accordion to see available components
3. Click on a component example to insert it into your document
4. Modify the props as needed
5. Save the document

## Testing

To test MDX integration:

1. Create a new document
2. Add markdown content with embedded form components
3. Switch to view mode
4. Verify that components render correctly
5. Fill out the form and verify validation works

