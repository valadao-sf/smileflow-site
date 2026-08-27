"use client";

import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "outline";
  size?: "sf-md";
};

/**
 * Scoped adapter of SmileFlow's canonical wizard button.
 *
 * Adapted from valadao-sf/smileflow at c02e3a14eb33316132cc4b802577955e27724bd9:
 * - src/components/ui/button.tsx
 * - src/components/ui/button-variants.ts
 */
export function Button({
  className,
  variant = "outline",
  size = "sf-md",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={[
        "nath-button",
        `nath-button--${variant}`,
        `nath-button--${size}`,
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
