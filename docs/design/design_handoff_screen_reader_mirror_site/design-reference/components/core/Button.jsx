import React from "react";
/** Outlined by default; primary = accent outline; filled = the one solid accent object; ghost = text only; ok = green "Copied" state. */
export function Button({ variant = "default", icon, children, ok = false, as = "button", className = "", ...rest }) {
  const v = variant === "primary" ? " srm-btn-primary" : variant === "filled" ? " srm-btn-filled" : variant === "ghost" ? " srm-btn-ghost" : variant === "icon" ? " srm-btn-ghost srm-btn-icon" : "";
  const Tag = as;
  return <Tag className={"srm-btn" + v + (ok ? " srm-btn-ok" : "") + (className ? " " + className : "")} type={as === "button" ? "button" : undefined} {...rest}>{icon}{children}</Tag>;
}
