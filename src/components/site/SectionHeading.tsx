import * as React from "react";

import { cn } from "../../lib/utils";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  inverse?: boolean;
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverse = false,
  className,
  titleClassName,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "space-y-5",
        centered && "mx-auto max-w-3xl text-center",
        className,
      )}
    >
      <div className={cn("eyebrow", inverse && "text-white/60")}>{eyebrow}</div>
      <h2
        className={cn(
          "max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary md:text-5xl lg:text-6xl",
          centered && "mx-auto",
          inverse && "text-brand-text-inverse",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-base leading-7 text-brand-text-secondary md:text-lg",
            centered && "mx-auto",
            inverse && "text-white/64",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
