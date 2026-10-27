import React from "react";
/** Kicker, headline, lead. Same block on every page section. level: "display" | "h1" | "h2". */
export function SectionHeader({ kicker, title, lead, level = "h2", id, badge }) {
  const H = level === "h2" ? "h2" : "h1";
  const cls = level === "display" ? "srm-display" : level === "h1" ? "srm-h1" : "srm-h2";
  return <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "60ch" }}>
    {kicker ? <p className="srm-kicker" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{badge}{kicker}</p> : null}
    <H id={id} className={cls}>{title}</H>
    {lead ? <p className="srm-lead">{lead}</p> : null}
  </div>;
}
