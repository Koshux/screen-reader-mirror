import React, { useState, useRef } from "react";
import { Button } from "./Button.jsx";
/** Copies text to the clipboard and shows the green "Copied" state for 1.8s. */
export function CopyButton({ text, label = "Copy", ariaLabel, onCopied, ...rest }) {
  const [done, setDone] = useState(false); const t = useRef();
  const copy = () => { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {}); clearTimeout(t.current); setDone(true); onCopied && onCopied(); t.current = setTimeout(() => setDone(false), 1800); };
  return <Button ok={done} aria-label={ariaLabel} onClick={copy} icon={done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> : null} {...rest}>{done ? "Copied" : label}</Button>;
}
