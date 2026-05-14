import * as React from "react";
import { motion } from "motion/react";
import { ArrowRight, Menu, User, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { navItems } from "../../content/siteContent";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../lib/utils";
import { Button, ButtonLink } from "../ui/Button";

const compactLabels: Record<string, string> = {
  "/auth": "Account access",
  "/book": "Book a ride",
  "/dashboard": "Dashboard",
  "/driver-signup": "Driver application",
  "/onboarding": "Complete profile",
  "/profile": "Profile",
};

interface NavbarProps {
  compact?: boolean;
}

export const Navbar = ({ compact = false }: NavbarProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, signOut } = useAuthStore();
  const { pathname, hash } = useLocation();
  const primaryItems = compact
    ? user
      ? [
          { label: "Book", to: "/book" },
          { label: "Dashboard", to: "/dashboard" },
        ]
      : [{ label: "Home", to: "/" }]
    : navItems;
  const surfaceLabel = compactLabels[pathname] ?? "HopIn";

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname, hash]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-brand-surface-strong/88 px-5 py-3 text-brand-text-inverse shadow-[var(--shadow-float)] backdrop-blur-xl md:px-7">
        <div className="flex items-center gap-8">
          <Link to="/" className="group flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[11px] font-bold uppercase tracking-[0.3em] text-brand-accent">
              HI
            </span>
            <div className="hidden sm:block">
              <p className="text-lg font-semibold tracking-[-0.04em] text-white">
                HopIn
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                shared city mobility
              </p>
            </div>
          </Link>

          {compact ? (
            <div className="hidden lg:flex">
              <span className="route-chip border-white/12 bg-white/6 text-white/78">
                {surfaceLabel}
              </span>
            </div>
          ) : null}

          <div className="hidden items-center gap-2 lg:flex">
            {primaryItems.map((item) => (
              item.to.startsWith("/#") ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 hover:bg-white/6 hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] hover:bg-white/6 hover:text-white",
                      isActive ? "bg-white/8 text-white" : "text-white/72",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 hover:bg-white/6 hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  aria-label="Open profile"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6"
                >
                  <User size={17} className="text-white/72" />
                </Link>
                <button
                  onClick={() => void signOut()}
                  className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 hover:bg-white/6 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 hover:bg-white/6 hover:text-white"
                >
                  Log In
                </Link>
                <ButtonLink to="/auth?mode=signup" variant="primary" size="md" className="gap-2">
                  Join HopIn
                  <ArrowRight size={14} />
                </ButtonLink>
              </>
            )}
          </div>

          <button
            className="rounded-full border border-white/10 bg-white/6 p-2.5 text-white lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={
          isOpen
            ? { height: "auto", opacity: 1, y: 0 }
            : { height: 0, opacity: 0, y: -16 }
        }
        id="mobile-navigation"
        className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-brand-surface-strong text-brand-text-inverse shadow-[var(--shadow-float)] lg:hidden"
      >
        <div className="flex flex-col gap-4 p-6">
          {primaryItems.map((item) => (
            item.to.startsWith("/#") ? (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 text-base font-semibold tracking-[-0.03em] text-white"
              >
                {item.label}
              </Link>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                    cn(
                      "rounded-[1.5rem] border px-5 py-4 text-base font-semibold tracking-[-0.03em]",
                      isActive
                      ? "border-brand-accent bg-brand-accent text-brand-surface-strong"
                      : "border-white/10 bg-white/6 text-white",
                    )
                }
              >
                {item.label}
              </NavLink>
            )
          ))}

          <div className="my-2 h-px bg-white/10" />

          <div className="flex flex-col gap-4">
            {user ? (
              <>
                <ButtonLink
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="w-full border-white/15 text-white hover:bg-white/10"
                >
                  Dashboard
                </ButtonLink>
                <ButtonLink
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="w-full border-white/15 text-white hover:bg-white/10"
                >
                  Profile
                </ButtonLink>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void signOut();
                    setIsOpen(false);
                  }}
                  className="w-full text-white/72 hover:bg-white/8 hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <ButtonLink
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="w-full border-white/15 text-white hover:bg-white/10"
                >
                  Log In
                </ButtonLink>
                <ButtonLink
                  to="/auth?mode=signup"
                  onClick={() => setIsOpen(false)}
                  variant="primary"
                  className="w-full"
                >
                  Sign Up
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
};
