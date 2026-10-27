import React from "react";
/** Labelled toggle. Label first, track last (or reversed with labelFirst=false). */
export function Switch({ checked, onChange, children, labelFirst = true, className = "" }) {
  return <label className={"srm-switch" + (className ? " " + className : "")} style={labelFirst ? { justifyContent: "space-between" } : undefined}>
    {labelFirst ? children : null}<input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><i aria-hidden="true"></i>{labelFirst ? null : children}
  </label>;
}
