export default function SelectSetting({
  title,
  description,
  value,
  options,
  onChange,
}) {
  return (
    <div className="simple-row">
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <label className="select-row">
        <select aria-label={title} value={value} onChange={onChange}>
          {options.map(({ label, value: optionValue }) => (
            <option key={optionValue} value={optionValue}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}