import PropTypes from 'prop-types';
import { Checkbox } from "@/components/ui/checkbox";

const CheckboxWrapper = ({ checked, onClick, label }) => {
  return (
    <button
      type="button"
      className={`group flex items-center justify-between text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer w-full focus:outline-none ${
        checked
          ? 'bg-[#1DB954]/5 border-[#1DB954]/20 text-white'
          : 'bg-neutral-900/20 hover:bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
      }`}
      onClick={onClick}
    >
      <span className="text-sm font-medium transition-colors duration-200">{label}</span>
      <Checkbox
        checked={checked}
        className="pointer-events-none data-[state=checked]:bg-[#1DB954] data-[state=checked]:border-[#1DB954] data-[state=checked]:text-black border-neutral-600"
      />
    </button>
  );
};

CheckboxWrapper.propTypes = {
  checked: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default CheckboxWrapper;