# Sample Form with DifferenceFromReference

## Temperature Measurement

Please enter the current room temperature:

<DifferenceFromReference id="room_temp" label="Room Temperature (°F)" required={true} pass={{min: -5.0, max: 5.0}} warn={{min: -10.0, max: 10.0}} mode="absolute" precision={2} />

The difference is calculated as: **your input - reference value**

---

## Pressure Measurement

Enter the pressure reading:

<DifferenceFromReference id="pressure" label="Pressure (PSI)" required={true} pass={{min: -2.0, max: 2.0}} mode="absolute" />

---

## Relative Difference Example

For percentage-based difference calculation:

<DifferenceFromReference id="voltage_diff" label="Voltage Difference (%)" required={true} pass={{min: -5.0, max: 5.0}} warn={{min: -10.0, max: 10.0}} mode="relative" precision={3} />

The difference is calculated as: **(your input - reference value) / reference value × 100%**

---

## With Default Value

<DifferenceFromReference id="humidity" label="Humidity (%)" default={50.0} pass={{min: -3.0, max: 3.0}} mode="absolute" />

---

## With Custom Width

<DifferenceFromReference id="narrow_field" label="Narrow Field" width="150px" pass={{min: -1.0, max: 1.0}} />

<DifferenceFromReference id="wide_field" label="Wide Field" width="300px" pass={{min: -2.0, max: 2.0}} />

---

## Notes

- The component automatically finds the reference submission (marked with the Reference checkbox in the Submissions tab)
- If no reference submission exists, the result will be set to "pass"
- The pass/fail status is evaluated based on the **calculated difference**, not the input value itself
- For absolute mode: difference = input - reference
- For relative mode: difference = (input - reference) / reference × 100%
