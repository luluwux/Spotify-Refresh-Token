import React from 'react';

const InputBox = ({ value, onChange, label }) => (
    <div className="bg-neutral-800 rounded-xl p-3 text-left align-middle">
        <div className="inline mr-4 font-bold">{label}:</div>
        <input
            className="bg-neutral-600 w-3/5 max-w-full text-black p-1 inline"
            type="text"
            name="clientId"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default InputBox;