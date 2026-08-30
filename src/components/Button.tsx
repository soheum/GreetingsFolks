import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "nav" | "outline" | "primary" | "unstyled";
type ButtonWeight = "normal" | "light";
type ButtonSize = "sm" | "md";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  weight?: ButtonWeight;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps &
  ComponentPropsWithoutRef<"button"> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"a">, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const buttonTypography =
  "font-display cursor-pointer tracking-[0.05em] uppercase";

const weightClasses: Record<ButtonWeight, string> = {
  normal: "font-normal",
  light: "font-light",
};

const variantClasses: Record<ButtonVariant, string> = {
  nav: `${buttonTypography} text-base text-neutral-900 transition-colors hover:text-red-600`,
  outline: `${buttonTypography} text-sm inline-flex items-center justify-center bg-white text-neutral-900 ring-1 ring-inset ring-neutral-900 transition hover:bg-neutral-50`,
  primary: `${buttonTypography} text-sm inline-flex items-center justify-center gap-2 bg-[#ec0000] text-white transition hover:bg-[#d40000] disabled:cursor-not-allowed disabled:opacity-40`,
  unstyled: "",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-w-32 px-5 py-2.5",
  md: "min-w-36 px-6 py-2.5",
};

const styledVariants = new Set<ButtonVariant>(["nav", "outline", "primary"]);

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  variant = "outline",
  weight = "normal",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const classes = cn(
    variantClasses[variant],
    styledVariants.has(variant) ? weightClasses[weight] : undefined,
    variant === "outline" || variant === "primary"
      ? sizeClasses[size]
      : undefined,
    className,
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorProps } = props;
    return <a href={href} className={classes} {...anchorProps} />;
  }

  const { type = "button", ...buttonProps } = props;
  return <button type={type} className={classes} {...buttonProps} />;
}
