export interface StepBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  n: number | string;
  size?: "md" | "sm";
}
export function StepBadge(props: StepBadgeProps): JSX.Element;
