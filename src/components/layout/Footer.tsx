import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="section-shell pt-10">
        <div className="section-frame space-y-10">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="space-y-6">
              <div className="eyebrow">Built for repeat routes</div>
              <h2 className="max-w-xl text-4xl font-black uppercase leading-[0.9] tracking-tighter text-black md:text-5xl">
                Shared mobility should feel direct, legible, and repeatable.
              </h2>
              <p className="max-w-lg border-l-4 border-black pl-5 text-base font-medium leading-8 text-black/65">
                HopIn focuses on corridor density, verified participants, and clear trip economics
                for Indian cities where everyday commutes deserve better software.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune"].map((city) => (
                  <span key={city} className="route-chip">
                    {city}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-black/55">
                Explore
              </p>
              <div className="space-y-3 text-sm font-medium text-black/65">
                <Link to="/" className="block hover:text-black">
                  Home
                </Link>
                <Link to="/about" className="block hover:text-black">
                  About
                </Link>
                <Link to="/cities" className="block hover:text-black">
                  Cities
                </Link>
                <Link to="/safety" className="block hover:text-black">
                  Safety
                </Link>
                <Link to="/blog" className="block hover:text-black">
                  Journal
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-5 text-[11px] font-black uppercase tracking-[0.24em] text-black/55">
                Contact
              </p>
              <div className="space-y-3 text-sm font-medium text-black/65">
                <Link to="/contact" className="block hover:text-black">
                  Support and partnerships
                </Link>
                <a href="mailto:help@hopin.co" className="block hover:text-black">
                  help@hopin.co
                </a>
                <a href="tel:+918045678900" className="block hover:text-black">
                  +91 80 4567 8900
                </a>
                <Link to="/terms" className="block hover:text-black">
                  Terms
                </Link>
                <Link to="/privacy" className="block hover:text-black">
                  Privacy
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-black pt-6 text-xs font-black uppercase tracking-[0.22em] text-black/55 md:flex-row md:items-center md:justify-between">
            <p>Copyright {new Date().getFullYear()} HopIn Mobility</p>
            <p>Shared commute software for Indian city corridors</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
