import "./Toggle.scss";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const Toggle = ({ checked, onChange, label, description }: ToggleProps) => (
  <div className="toggle">
    <label className="toggle__control">
      <input
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track">
        <span className="toggle__knob" />
      </span>
      <span className="toggle__label">{label}</span>
    </label>
    {description && <p className="toggle__description">{description}</p>}
  </div>
);

export default Toggle;
