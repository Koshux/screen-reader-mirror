export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The text written to the clipboard. */
  text: string;
  /** Idle label. Default "Copy". */
  label?: string;
  ariaLabel?: string;
  /** Called after a copy; use it to announce "Copied." in a live region. */
  onCopied?: () => void;
}
export function CopyButton(props: CopyButtonProps): JSX.Element;
