import React, { useState } from 'react';
import {
  Box,
  TextField,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const MDX_EXAMPLES = {
  TextInput: '<TextInput label="Patient Name" required={true} />',
  NumberInput:
    '<NumberInput label="Dose (Gy)" required={true} pass={{min: 1.9, max: 2.1}} warn={{min: 1.8, max: 2.2}} />',
  Dropdown:
    '<Dropdown label="Machine" options={["Linac A", "Linac B"]} correct="Linac A" />',
  RadioButtons:
    '<RadioButtons label="Status" options={["Active", "Inactive"]} correct="Active" />',
  MultipleChoice:
    '<MultipleChoice label="Symptoms" options={["Fever", "Cough", "Headache"]} correct={["Fever", "Cough"]} />',
  DateInput: '<DateInput label="Date" required={true} />',
  TimeInput: '<TimeInput label="Time" required={true} />',
  Calculate:
    '<Calculate label="Total Dose" sources={["Dose (Gy)", "Boost Dose"]} op="add" precision={2} />',
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  readOnly = false,
}) => {
  const [showExamples, setShowExamples] = useState(false);

  const insertExample = (example: string) => {
    const cursorPos = (document.activeElement as HTMLTextAreaElement)?.selectionStart || content.length;
    const newContent =
      content.slice(0, cursorPos) + '\n' + example + '\n' + content.slice(cursorPos);
    onChange(newContent);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">MDX Editor</Typography>
          <Accordion
            expanded={showExamples}
            onChange={() => setShowExamples(!showExamples)}
            sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 'auto', py: 0 }}
            >
              <Typography variant="body2" color="primary">
                Component Examples
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(MDX_EXAMPLES).map(([name, example]) => (
                  <Box key={name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={name}
                        size="small"
                        onClick={() => insertExample(example)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                    <Box
                      component="code"
                      sx={{
                        display: 'block',
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'grey.200',
                        },
                      }}
                      onClick={() => insertExample(example)}
                    >
                      {example}
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <TextField
          multiline
          fullWidth
          value={content}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          variant="outlined"
          placeholder={`# Form Title

Enter your markdown content here. You can embed form controls using MDX syntax:

<TextInput label="Patient Name" required={true} />

<NumberInput label="Dose (Gy)" required={true} pass={{min: 1.9, max: 2.1}} />

<Dropdown label="Machine" options={["Option 1", "Option 2"]} />

<Calculate label="Total" sources={["Field A", "Field B"]} op="add" />

See the Component Examples above for more syntax.`}
          sx={{
            height: '100%',
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
            '& textarea': {
              height: '100% !important',
              overflow: 'auto !important',
              fontFamily: 'monospace',
            },
          }}
        />
      </Box>
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          <CodeIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
          MDX syntax supported. Click component examples above to insert code.
        </Typography>
      </Box>
    </Box>
  );
};

export default MarkdownEditor;
