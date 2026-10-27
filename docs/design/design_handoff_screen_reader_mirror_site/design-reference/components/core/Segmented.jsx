import React from "react";
/** Mutually exclusive views on native radios. options: [{value,label}]. */
export function Segmented({ name, options, value, onChange, size = "md", ariaLabel }) {
  return <span className={"srm-seg" + (size === "sm" ? " srm-seg-sm" : "")} role="radiogroup" aria-label={ariaLabel}>
    {options.map(o => <label key={o.value}><input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />{o.label}</label>)}
  </span>;
}
