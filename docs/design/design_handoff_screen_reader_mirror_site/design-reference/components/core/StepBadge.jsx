import React from "react";
/** Filled accent circle with a number. 28px by default, 22px small (kickers, nav). */
export function StepBadge({ n, size = "md", ...rest }) {
  return <span aria-hidden="true" className={"srm-step" + (size === "sm" ? " srm-step-sm" : "")} {...rest}>{n}</span>;
}
