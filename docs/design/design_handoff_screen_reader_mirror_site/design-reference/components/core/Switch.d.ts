export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The visible label. */
  children: React.ReactNode;
  /** Label before the track (settings rows) or after it (pane headers). Default true. */
  labelFirst?: boolean;
  className?: string;
}
export function Switch(props: SwitchProps): JSX.Element;
