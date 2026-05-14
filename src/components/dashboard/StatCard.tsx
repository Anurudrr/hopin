import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  color = "text-brand-text-primary",
  className
}) => {
  return (
    <div className={cn("panel p-6", className)}>
      <div className={cn("mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-bg-secondary transition-colors", color)}>
        <Icon size={20} />
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">{label}</p>
      <p className="text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">{value}</p>
    </div>
  );
};
