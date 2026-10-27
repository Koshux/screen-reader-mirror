export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Mono trailing detail, e.g. "11 items". */
  meta?: React.ReactNode;
}
export function Toast(props: ToastProps): JSX.Element;
