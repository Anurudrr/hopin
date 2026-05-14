import * as React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="section-shell pt-0">
      <div className="section-frame">
        <div className="panel-dark overflow-hidden px-6 py-10 md:px-10 md:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="space-y-6">
              <div className="eyebrow text-white/55">Built for repeat routes</div>
              <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Shared mobility should feel <span className="serif-accent">composed</span>, not improvised.
              </h2>
              <p className="max-w-lg text-base leading-7 text-white/72">
                HopIn focuses on corridor density, verified participants, and clear trip economics for Indian cities where everyday commutes deserve better software.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune"].map((city) => (
                  <span key={city} className="route-chip border-white/12 bg-white/6 text-white/72">
                    {city}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                Explore
              </p>
              <div className="space-y-3 text-sm text-white/72">
                <Link to="/" className="block hover:text-white">
                  Home
                </Link>
                <Link to="/about" className="block hover:text-white">
                  About
                </Link>
                <Link to="/cities" className="block hover:text-white">
                  Cities
                </Link>
                <Link to="/safety" className="block hover:text-white">
                  Safety
                </Link>
                <Link to="/blog" className="block hover:text-white">
                  Journal
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                Contact
              </p>
              <div className="space-y-3 text-sm text-white/72">
                <Link to="/contact" className="block hover:text-white">
                  Support and partnerships
                </Link>
                <a href="mailto:help@hopin.co" className="block hover:text-white">
                  help@hopin.co
                </a>
                <a href="tel:+918045678900" className="block hover:text-white">
                  +91 80 4567 8900
                </a>
                <Link to="/terms" className="block hover:text-white">
                  Terms
                </Link>
                <Link to="/privacy" className="block hover:text-white">
                  Privacy
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.22em] text-white/40 md:flex-row md:items-center md:justify-between">
            <p>Copyright {new Date().getFullYear()} HopIn Mobility</p>
            <p>Shared commute software for Indian city corridors</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
