/** @startingPoint section="Controls" subtitle="Outlined, primary, filled, ghost, icon" viewport="700x160" */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** default: hairline. primary: accent outline (most actions). filled: solid accent, one per view at most. ghost: text only. icon: square ghost for a single glyph. */
  variant?: "default" | "primary" | "filled" | "ghost" | "icon";
  /** Leading glyph, 14–16px Lucide-style stroke. */
  icon?: React.ReactNode;
  /** Green "done" state used for Copy buttons for 1.8s after a copy. */
  ok?: boolean;
  /** Render as another tag, e.g. "a" for links styled as buttons. */
  as?: "button" | "a" | "span";
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
