import * as React from "react";

import { cn } from "../../lib/utils";

interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  priority?: boolean;
}

export const OptimizedImage = React.forwardRef<
  HTMLImageElement,
  OptimizedImageProps
>(({ className, priority = false, sizes, ...props }, ref) => (
  <img
    ref={ref}
    loading={priority ? "eager" : "lazy"}
    decoding="async"
    fetchPriority={priority ? "high" : "auto"}
    sizes={sizes}
    className={cn(className)}
    {...props}
  />
));

OptimizedImage.displayName = "OptimizedImage";
