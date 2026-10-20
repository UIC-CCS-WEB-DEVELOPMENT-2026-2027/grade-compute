export default function SettingRow({ title, description, children }) {
  return (
    <div className="simple-row">
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}