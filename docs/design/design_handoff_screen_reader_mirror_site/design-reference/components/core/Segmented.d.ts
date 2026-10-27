export interface SegmentedProps {
  /** Shared radio name; unique per instance on the page. */
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** md: 38px rows. sm: 32px, used inside pane headers. */
  size?: "md" | "sm";
  ariaLabel?: string;
}
export function Segmented(props: SegmentedProps): JSX.Element;
