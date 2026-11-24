// A row of tappable chips where you pick one option, or none.
// Tapping the selected chip again un-selects it (these fields are optional).
// <T extends string> makes it work for any list of words, e.g. TimeOfDay.

interface Props<T extends string> {
  label: string
  options: readonly T[]
  value: T | null
  onChange: (value: T | null) => void
}

export default function ChoiceChips<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <fieldset className="chips">
      <legend>{label}</legend>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? null : option)}
        >
          {option}
        </button>
      ))}
    </fieldset>
  )
}
