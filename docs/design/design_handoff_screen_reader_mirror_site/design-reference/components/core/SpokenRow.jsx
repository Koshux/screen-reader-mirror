import React from "react";
import { Note } from "./Note.jsx";
/** One item of the reading order: what is spoken, and optionally a Note from the mirror that is not spoken. */
export function SpokenRow({ name, role, note, highlighted = false, ...rest }) {
  return <li tabIndex={0} className={"srm-row" + (highlighted ? " hl" : "")} {...rest}>
    <span className="srm-say"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg><span style={{ minWidth: 0, overflowWrap: "break-word" }}>{name}{name && role ? <span className="role">, </span> : null}{role ? <span className="role">{role}</span> : null}</span></span>
    {note ? <Note>{note}</Note> : null}
  </li>;
}
