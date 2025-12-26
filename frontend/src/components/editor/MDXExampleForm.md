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

<RadioButtons
  label="Status"
  options={["Active", "Inactive", "Maintenance"]}
  correct="Active"
/>

<MultipleChoice
  label="Symptoms"
  options={["Fever", "Cough", "Headache", "Fatigue"]}
  correct={["Fever", "Cough"]}
/>

<DateInput label="Date" required />

<TimeInput label="Time" required />

## Notes

Additional notes or observations can be added here using regular markdown.

