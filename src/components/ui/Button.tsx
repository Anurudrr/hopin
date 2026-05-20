import * as React from "react";
import { Link, type LinkProps } from "react-router-dom";

import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-accent text-brand-surface-strong shadow-[var(--shadow-panel)] hover:bg-brand-accent-hover",
  secondary:
    "bg-brand-surface-strong text-brand-text-inverse hover:bg-black",
  outline:
    "border border-brand-border bg-transparent text-brand-text-primary hover:bg-brand-surface-soft",
  ghost:
    "bg-transparent text-brand-text-secondary hover:bg-brand-surface-soft hover:text-brand-text-primary",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5",
  md: "px-6 py-3",
  lg: "px-8 py-4 md:px-10",
};

export function buttonStyles({
  className,
  size = "md",
  variant = "primary",
}: ButtonStyleProps = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-[0.22em] text-[11px] transition-all motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:pointer-events-none disabled:opacity-50 disabled:motion-safe:hover:translate-y-0 disabled:motion-safe:active:scale-100",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size = "md", type = "button", variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ className, size, variant })}
      {...props}
    />
  ),
);

Button.displayName = "Button";

type RouterButtonLinkProps = ButtonStyleProps &
  Omit<LinkProps, "className" | "to"> & {
    to: LinkProps["to"];
  };

type AnchorButtonLinkProps = ButtonStyleProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    to?: never;
  };

export type ButtonLinkProps = RouterButtonLinkProps | AnchorButtonLinkProps;

function isRouterButtonLinkProps(props: ButtonLinkProps): props is RouterButtonLinkProps {
  return "to" in props && props.to !== undefined;
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, size = "md", variant = "primary", ...props }, ref) => {
    const sharedClassName = buttonStyles({ className, size, variant });

    if (isRouterButtonLinkProps(props)) {
      const { to, ...linkProps } = props;

      return <Link ref={ref} to={to} className={sharedClassName} {...linkProps} />;
    }

    const { href, ...anchorProps } = props as AnchorButtonLinkProps;

    return <a ref={ref} href={href} className={sharedClassName} {...anchorProps} />;
  },
);

ButtonLink.displayName = "ButtonLink";
