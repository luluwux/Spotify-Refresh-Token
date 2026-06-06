import { useState } from 'react';
import PropTypes from 'prop-types';

const InputBox = ({ value, onChange, label, type = 'text', placeholder = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col text-left gap-1">
      <label className="text-sm font-semibold text-neutral-400 pl-1">{label}</label>
      <div className="relative flex items-center bg-neutral-800/80 border border-neutral-700/50 rounded-xl focus-within:border-[#1DB954]/50 focus-within:ring-2 focus-within:ring-[#1DB954]/10 transition-all duration-200">
        <input
          className="bg-transparent w-full text-white px-4 py-3 text-sm rounded-xl outline-none placeholder-neutral-500 pr-12"
          type={currentType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 p-1 text-neutral-400 hover:text-white transition-colors duration-150 text-xs font-semibold focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Gizle' : 'Göster'}
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