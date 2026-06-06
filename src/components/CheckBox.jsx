import PropTypes from 'prop-types';

const Checkbox = ({ checked, onClick, label }) => (
  <button
    type="button"
    className={`group flex items-center justify-between text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer w-full focus:outline-none ${
      checked
        ? 'bg-[#1DB954]/5 border-[#1DB954]/30 text-white'
        : 'bg-neutral-800/40 hover:bg-neutral-800/80 border-neutral-700/50 text-neutral-400 hover:text-neutral-200'
    }`}
    onClick={onClick}
  >
    <span className="text-sm font-medium transition-colors duration-200">{label}</span>
    <div
      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
        checked
          ? 'bg-[#1DB954] border-[#1DB954] text-black shadow-[0_0_10px_rgba(29,185,84,0.3)]'
          : 'border-neutral-500 group-hover:border-neutral-300'
      }`}
    >
      {checked && (
        <svg
          className="w-3.5 h-3.5 stroke-[3]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  </button>
);

Checkbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default Checkbox;