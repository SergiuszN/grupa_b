"use client";

import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import { Link } from "@/i18n/routing";

export type ButtonVariant = "primary" | "outline" | "secondary" | "ghost";
export type ButtonTone = "light" | "dark";
export type ButtonSize = "default" | "lg" | "md" | "sm" | "xs" | "icon";

export interface BaseButtonProps {
  /** Visual variant: primary (gold filled), outline/secondary, ghost */
  variant?: ButtonVariant;
  /** Background tone context: light (default) or dark (for dark hero/backgrounds) */
  tone?: ButtonTone;
  /** Size variant */
  size?: ButtonSize;
  /** Stretch to full width */
  fullWidth?: boolean;
  /** Set flex-1 */
  flex1?: boolean;
  /** Icon rendered before children / text */
  iconLeft?: ReactNode;
  /** Icon rendered after children / text */
  iconRight?: ReactNode;
  /** Extra class names */
  className?: string;
  /** Children / label */
  children?: ReactNode;
}

export type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: undefined;
  };

export type ButtonAsLink = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASSES: Record<
  ButtonVariant,
  Record<ButtonTone, string>
> = {
  primary: {
    light: "bg-gold text-white hover:bg-gold-deep active:bg-gold-deep",
    dark: "bg-gold text-white hover:bg-gold-deep active:bg-gold-deep",
  },
  outline: {
    light: "border-[1.5px] border-ink text-ink hover:bg-surface",
    dark: "border-[1.5px] border-paper text-paper hover:bg-paper/10",
  },
  secondary: {
    light: "border-[1.5px] border-ink text-ink hover:bg-surface",
    dark: "border-[1.5px] border-paper text-paper hover:bg-paper/10",
  },
  ghost: {
    light: "text-ink hover:bg-surface",
    dark: "text-paper hover:bg-paper/10",
  },
};

const FOCUS_CLASSES: Record<ButtonTone, Record<ButtonVariant, string>> = {
  light: {
    primary:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper forced-colors:focus-visible:outline",
    outline:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-paper forced-colors:focus-visible:outline",
    secondary:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-paper forced-colors:focus-visible:outline",
    ghost:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-paper forced-colors:focus-visible:outline",
  },
  dark: {
    primary:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink forced-colors:focus-visible:outline",
    outline:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink forced-colors:focus-visible:outline",
    secondary:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink forced-colors:focus-visible:outline",
    ghost:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink forced-colors:focus-visible:outline",
  },
};

const SIZE_CLASSES = {
  pill: {
    lg: "h-14 px-6 text-[15px] leading-5 font-bold",
    default: "h-14 px-6 text-[15px] leading-5 font-bold",
    md: "h-[52px] px-5 text-[16px] leading-5 font-medium",
    sm: "h-11 px-4 text-[14px] leading-5 font-medium",
    xs: "h-9 px-3 text-[13px] leading-4 font-medium",
    icon: "size-14 p-0 shrink-0 aspect-square",
  },
  iconOnly: {
    lg: "size-14 p-0 shrink-0 aspect-square",
    default: "size-14 p-0 shrink-0 aspect-square",
    md: "size-[52px] p-0 shrink-0 aspect-square",
    sm: "size-11 p-0 shrink-0 aspect-square",
    xs: "size-9 p-0 shrink-0 aspect-square",
    icon: "size-14 p-0 shrink-0 aspect-square",
  },
} as const;

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = "primary",
    tone = "light",
    size = "default",
    fullWidth = false,
    flex1 = false,
    iconLeft,
    iconRight,
    className = "",
    children,
    ...restProps
  } = props;

  const isIconOnly =
    size === "icon" ||
    (!children && Boolean(iconLeft || iconRight));

  const baseClasses =
    "inline-flex items-center justify-center rounded-full transition-colors transition-transform select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed";

  const sizeClass = isIconOnly
    ? SIZE_CLASSES.iconOnly[size]
    : SIZE_CLASSES.pill[size];

  const variantClass =
    VARIANT_CLASSES[variant]?.[tone] ?? VARIANT_CLASSES.primary[tone];

  const focusClass =
    FOCUS_CLASSES[tone]?.[variant] ?? FOCUS_CLASSES[tone].primary;

  const interactionClass = isIconOnly
    ? "active:scale-95"
    : "active:scale-[0.98]";

  const widthClass = fullWidth ? "w-full" : flex1 ? "flex-1" : "";
  const gapClass = !isIconOnly && (iconLeft || iconRight) ? "gap-2" : "";

  const combinedClassName = [
    baseClasses,
    sizeClass,
    variantClass,
    focusClass,
    interactionClass,
    widthClass,
    gapClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Render external link
  if (typeof restProps.href === "string") {
    const isExternal =
      restProps.href.startsWith("http://") ||
      restProps.href.startsWith("https://") ||
      restProps.href.startsWith("mailto:") ||
      restProps.href.startsWith("tel:");

    const linkContent = (
      <>
        {iconLeft}
        {children}
        {iconRight}
      </>
    );

    if (isExternal) {
      const { href, target, rel, ...anchorProps } =
        restProps as AnchorHTMLAttributes<HTMLAnchorElement>;

      return (
        <a
          className={combinedClassName}
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
          target={target}
          {...anchorProps}
        >
          {linkContent}
        </a>
      );
    }

    // Next-intl internal link
    const { href, ...linkProps } = restProps as { href: string; [key: string]: unknown };
    return (
      <Link
        className={combinedClassName}
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...linkProps}
      >
        {linkContent}
      </Link>
    );
  }

  // Native button
  const buttonProps = restProps as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      className={combinedClassName}
      ref={ref as React.Ref<HTMLButtonElement>}
      type={buttonProps.type ?? "button"}
      {...buttonProps}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
});

Button.displayName = "Button";

/** Alias for CTA usage */
export const CtaButton = Button;
