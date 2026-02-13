interface NumericFieldProps {
  label: string;
  step: number;
  min: number;
  max: number;
  value: string;
  error: string | undefined;
  errorId: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function NumericField({
  label,
  step,
  min,
  max,
  value,
  error,
  errorId,
  onChange,
  onBlur,
}: NumericFieldProps) {
  return (
    <label>
      {label}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onBlur}
      />
      {error ? (
        <span id={errorId} className="field-validation-message" role="status">
          {error}
        </span>
      ) : null}
    </label>
  );
}
