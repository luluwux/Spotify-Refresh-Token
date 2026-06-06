import { useState } from 'react';
import PropTypes from 'prop-types';
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from 'lucide-react';

const InputBox = ({ value, onChange, label, type = 'text', placeholder = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col text-left gap-1.5 w-full">
      <label className="text-sm font-semibold text-neutral-400 pl-1">{label}</label>
      <div className="relative flex items-center">
        <Input
          className="w-full bg-neutral-900/40 border-neutral-800 text-white pr-10 h-11 rounded-xl focus-visible:ring-[#1DB954] focus-visible:border-[#1DB954]/50 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200"
          type={currentType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 p-1 text-neutral-400 hover:text-neutral-200 transition-colors duration-150 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

InputBox.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
};

export default InputBox;