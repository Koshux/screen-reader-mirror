import React from "react";
/** A remark from the mirror. Dashed, yellow, italic, always with the warning glyph; visually and semantically separate from speech. */
export function Note({ children, className = "" }) {
  return <span className={"srm-note" + (className ? " " + className : "")}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg><span><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Note, not spoken: </span>{children}</span></span>;
}
