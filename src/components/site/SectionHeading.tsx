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
  inverse: _inverse = false,
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
      <div className="eyebrow">{eyebrow}</div>
      <h2
        className={cn(
          "max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-tighter text-black md:text-6xl lg:text-7xl",
          centered && "mx-auto",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-3xl text-base font-medium leading-8 text-black/65 md:text-lg",
            centered ? "mx-auto" : "border-l-4 border-black pl-5",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
