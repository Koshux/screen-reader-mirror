/** @startingPoint section="Layout" subtitle="Kicker, headline, lead" viewport="700x200" */
export interface SectionHeaderProps {
  /** Uppercase accent line above the headline, e.g. "Getting started". */
  kicker?: string;
  /** Headline. Ends with a full stop on landing sections. */
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** display: landing hero. h1: inner page intro. h2: page section. */
  level?: "display" | "h1" | "h2";
  id?: string;
  /** Optional StepBadge or pulse dot before the kicker. */
  badge?: React.ReactNode;
}
export function SectionHeader(props: SectionHeaderProps): JSX.Element;
