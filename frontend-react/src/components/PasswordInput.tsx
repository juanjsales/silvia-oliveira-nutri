import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`password-input ${className}`}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Ocultar senha' : 'Exibir senha'}
        title={visible ? 'Ocultar senha' : 'Exibir senha'}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
