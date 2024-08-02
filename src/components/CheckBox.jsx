import React from 'react';

const Checkbox = ({ checked, onClick, label }) => (
    <button type="button" className="bg-neutral-800 hover:bg-neutral-700 duration-150 cursor-pointer p-3 flex align-middle rounded-lg" onClick={onClick}>
        <input type="checkbox" checked={checked} className="m-auto" onChange={() => { }} />
        <div className="flex-1 cursor-pointer">{label}</div>
    </button>
);

export default Checkbox;