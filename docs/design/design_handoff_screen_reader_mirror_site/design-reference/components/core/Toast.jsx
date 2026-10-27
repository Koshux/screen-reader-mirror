import React from "react";
/** Brief status shown bottom-right over a host page. Also use role="status". */
export function Toast({ children, meta, ...rest }) {
  return <div role="status" className="srm-toast" {...rest}><span className="srm-mark" style={{ width: 18, height: 18, fontSize: 8, borderRadius: 5 }}>sr</span>{children}{meta ? <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{meta}</span> : null}</div>;
}
