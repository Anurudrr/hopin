import * as React from "react";

import { cn } from "../../lib/utils";

interface AvatarProps {
  alt?: string;
  className?: string;
  imageClassName?: string;
  name?: string | null;
  sizes?: string;
  src?: string | null;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "HI";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  alt,
  className,
  imageClassName,
  name,
  sizes,
  src,
}: AvatarProps) {
  const initials = React.useMemo(() => getInitials(name), [name]);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full border-2 border-black bg-white text-black",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? `${name ?? "HopIn user"} avatar`}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <span className="text-sm font-black uppercase tracking-[0.18em]">
          {initials}
        </span>
      )}
    </div>
  );
}
