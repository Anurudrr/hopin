import { ArrowRight, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { motion } from "motion/react";

import { supportedCities } from "../content/siteContent";
import { ButtonLink } from "./ui/Button";

const rideSignals = [
  "Browse routes already published by approved drivers",
  "Review departure time, seat count, and fare before booking",
  "Switch cities to compare live inventory instead of simulated matches",
];

const LiveBooking = () => {
  return (
    <section id="network" className="relative overflow-hidden border-b-2 border-black bg-white py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.34em] text-black/50">
            Live booking surface
          </p>
          <h2 className="mb-6 text-5xl font-black uppercase tracking-tighter text-black md:text-7xl">
            Real rides.
            <br />
            No fake queue.
          </h2>
          <p className="mb-10 max-w-2xl text-xl font-medium leading-relaxed text-black">
            The booking flow now opens the actual product surface: city-level inventory, driver
            context, route timing, and seat pricing pulled from live ride records.
          </p>

          <div className="mb-10 flex flex-wrap gap-3">
            {supportedCities.map((city) => (
              <span key={city} className="route-chip border-black bg-white text-black shadow-soft">
                {city}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            {rideSignals.map((signal) => (
              <div
                key={signal}
                className="flex items-start gap-4 border-l-4 border-black pl-4 text-base font-medium text-black"
              >
                <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                <span>{signal}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink to="/book" size="lg" className="gap-2">
              Open Booking Surface
              <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink to="/cities" variant="outline" size="lg">
              Explore City Coverage
            </ButtonLink>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden border-4 border-black bg-white p-8 shadow-premium"
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-black/55">
                  Product snapshot
                </p>
                <h3 className="mt-2 text-3xl font-black uppercase tracking-tight text-black">
                  What the live flow shows
                </h3>
              </div>
              <div className="rounded-full border-2 border-black px-4 py-2 text-xs font-bold uppercase tracking-[0.22em]">
                Real data
              </div>
            </div>

            <div className="grid gap-4">
              <div className="border-2 border-black bg-black p-5 text-white shadow-soft">
                <div className="flex items-center gap-3">
                  <MapPin size={18} />
                  <p className="text-sm font-bold uppercase tracking-[0.22em]">
                    Route and city context
                  </p>
                </div>
                <p className="mt-3 text-base text-white/80">
                  Pickup corridor, destination corridor, and city-specific inventory.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-2 border-black bg-white p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <Clock3 size={18} />
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-black">
                      Departure timing
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-7 text-black/72">
                    Riders see when the route actually leaves instead of a made-up ETA.
                  </p>
                </div>
                <div className="border-2 border-black bg-white p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-black">
                      Seat and fare state
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-7 text-black/72">
                    Seat count and fare totals update from the selected ride.
                  </p>
                </div>
              </div>

              <div className="border-2 border-black bg-white p-5 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-black/55">
                  Why this changed
                </p>
                <p className="mt-3 text-lg font-bold text-black">
                  The homepage should route people into the real booking experience, not a demo that
                  pretends to search.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveBooking;
