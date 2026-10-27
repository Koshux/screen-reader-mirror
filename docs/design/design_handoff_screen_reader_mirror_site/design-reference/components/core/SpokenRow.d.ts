/** @startingPoint section="Mirror" subtitle="One spoken item with an optional note" viewport="700x120" */
export interface SpokenRowProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** The accessible name as spoken. Empty when the element has none. */
  name: string;
  /** The role phrase as spoken: "heading level 1", "button", "edit text", "image", "main landmark". Empty for plain text. */
  role?: string;
  /** A remark from the mirror. Rendered as a dashed note, never as speech. */
  note?: React.ReactNode;
  /** Synced with the element under the pointer or focus on the page. */
  highlighted?: boolean;
}
export function SpokenRow(props: SpokenRowProps): JSX.Element;
