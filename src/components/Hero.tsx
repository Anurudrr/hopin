import * as React from "react";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { supportedCities } from "../content/siteContent";
import { cn } from "../lib/utils";
import { ButtonLink } from "./ui/Button";

type City = (typeof supportedCities)[number];

const cityPreviewContent: Record<
  City,
  {
    corridor: string;
    fare: string;
    window: string;
    liveRides: string;
    routes: Array<{
      from: string;
      to: string;
      fare: string;
      seats: string;
    }>;
  }
> = {
  Mumbai: {
    corridor: "Powai to BKC",
    fare: "INR 150",
    window: "Next departures in 18 min",
    liveRides: "14 live rides",
    routes: [
      { from: "Powai Lake", to: "BKC", fare: "INR 150", seats: "3 seats" },
      { from: "Andheri East", to: "Worli", fare: "INR 180", seats: "2 seats" },
      { from: "Borivali West", to: "BKC", fare: "INR 220", seats: "4 seats" },
    ],
  },
  Delhi: {
    corridor: "Saket to Connaught Place",
    fare: "INR 130",
    window: "Next departures in 14 min",
    liveRides: "11 live rides",
    routes: [
      { from: "Saket District Centre", to: "Connaught Place", fare: "INR 130", seats: "2 seats" },
      { from: "Hauz Khas Village", to: "Karol Bagh", fare: "INR 145", seats: "3 seats" },
      { from: "Dwarka Sector 21", to: "CP", fare: "INR 165", seats: "4 seats" },
    ],
  },
  Bangalore: {
    corridor: "Indiranagar to ORR",
    fare: "INR 120",
    window: "Next departures in 12 min",
    liveRides: "16 live rides",
    routes: [
      { from: "Indiranagar 100ft Rd", to: "Whitefield ITPL", fare: "INR 120", seats: "3 seats" },
      { from: "Koramangala 4th Block", to: "Manyata corridor", fare: "INR 135", seats: "2 seats" },
      { from: "HSR Layout Sector 2", to: "MG Road Metro", fare: "INR 110", seats: "4 seats" },
    ],
  },
  Hyderabad: {
    corridor: "Gachibowli to Hitech City",
    fare: "INR 110",
    window: "Next departures in 16 min",
    liveRides: "9 live rides",
    routes: [
      { from: "Gachibowli DLF", to: "Hitech City", fare: "INR 110", seats: "2 seats" },
      { from: "Jubilee Hills", to: "Cyber Towers", fare: "INR 140", seats: "3 seats" },
      { from: "Banjara Hills", to: "Gachibowli", fare: "INR 125", seats: "4 seats" },
    ],
  },
  Pune: {
    corridor: "Viman Nagar to Hinjewadi",
    fare: "INR 115",
    window: "Next departures in 20 min",
    liveRides: "8 live rides",
    routes: [
      { from: "Viman Nagar", to: "Hinjewadi Phase 1", fare: "INR 115", seats: "2 seats" },
      { from: "Koregaon Park", to: "Shivaji Nagar", fare: "INR 95", seats: "3 seats" },
      { from: "Shivaji Nagar", to: "Hinjewadi", fare: "INR 125", seats: "4 seats" },
    ],
  },
};

const Hero = () => {
  const [selectedCity, setSelectedCity] = React.useState<City>(supportedCities[0]);
  const preview = cityPreviewContent[selectedCity];

  return (
    <section className="relative overflow-hidden border-b-2 border-black bg-white pb-20 pt-28 md:pb-28 md:pt-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "104px 104px",
        }}
      />
      <div className="pointer-events-none absolute right-[8%] top-24 h-44 w-44 rounded-full bg-black/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 left-[6%] h-32 w-32 rounded-full bg-black/[0.03] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)] xl:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-3 border-2 border-black bg-white px-4 py-2 shadow-soft">
              <span className="h-2.5 w-2.5 rounded-full bg-black" />
              <span className="text-xs font-black uppercase tracking-[0.28em] text-black">
                Live booking surface
              </span>
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.28em] text-black/50">
              Shared city mobility
            </p>

            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.92] tracking-tighter text-black md:text-7xl lg:text-[5.8rem]">
              Real commute
              <br />
              routes, not
              <br />
              placeholder search.
            </h1>

            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-black/70 md:text-xl">
              Browse published shared rides, see per-seat pricing upfront, and move into the live
              booking flow with your city already selected.
            </p>

            <div className="panel mt-10 max-w-xl p-4 md:p-5">
              <div className="grid gap-3">
                <label
                  htmlFor="hero-city"
                  className="border-2 border-black bg-white px-4 py-4 shadow-soft transition-shadow hover:shadow-premium focus-within:shadow-premium"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                    Start with a live city
                  </span>
                  <div className="relative mt-3 flex items-center gap-3 pr-7">
                    <MapPin size={18} className="shrink-0 text-black" />
                    <select
                      id="hero-city"
                      value={selectedCity}
                      onChange={(event) => setSelectedCity(event.target.value as City)}
                      className="w-full appearance-none bg-transparent text-lg font-black uppercase tracking-[0.08em] text-black outline-none"
                    >
                      {supportedCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-black/55"
                    />
                  </div>
                </label>

                <div className="border-2 border-black bg-gray-100 px-4 py-4 shadow-soft">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                    What opens next
                  </p>
                  <p className="mt-2 text-base font-black uppercase tracking-[0.08em] text-black">
                    {preview.corridor}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Live rides, seat availability, and clearer fare visibility for repeated city
                    movement.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  to={`/book?city=${encodeURIComponent(selectedCity)}`}
                  size="lg"
                  className="group gap-2 sm:flex-1"
                >
                  Open {selectedCity} rides
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </ButtonLink>
                <ButtonLink to="/driver-signup" variant="outline" size="lg" className="sm:flex-1">
                  Driver application
                </ButtonLink>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {supportedCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    aria-pressed={selectedCity === city}
                    className={cn(
                      "route-chip transition-shadow",
                      selectedCity === city
                        ? "bg-black text-white shadow-premium"
                        : "hover:shadow-premium",
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-[420px] lg:min-h-[600px]"
          >
            <div className="absolute inset-[10%_0_4%_16%] hidden border-2 border-black/10 bg-white/50 lg:block" />

            <div className="absolute left-0 top-8 hidden xl:block">
              <div className="panel px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                  City-first inventory
                </p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-black">
                  {preview.liveRides}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 hidden xl:block">
              <div className="panel-dark px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                  Fare clarity
                </p>
                <p className="mt-2 text-lg font-black uppercase tracking-tight text-white">
                  {preview.fare} average seat
                </p>
              </div>
            </div>

            <div className="relative ml-auto flex h-full w-full max-w-[540px] items-center lg:pt-10">
              <div className="relative w-full border-4 border-black bg-white p-6 shadow-premium md:p-8">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                        Route preview
                      </p>
                      <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-black md:text-4xl">
                        {selectedCity} commute board
                      </h2>
                    </div>
                    <span className="route-chip bg-white text-black shadow-soft">Live</span>
                  </div>

                  <div className="mt-8 space-y-3">
                    {preview.routes.map((route) => (
                      <div
                        key={`${route.from}-${route.to}`}
                        className="border-2 border-black bg-white p-4 shadow-soft transition-shadow hover:shadow-premium"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black uppercase tracking-[0.12em] text-black">
                              {route.from}
                            </p>
                            <p className="mt-1 text-sm text-black/50">to {route.to}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black uppercase tracking-[0.1em] text-black">
                              {route.fare}
                            </p>
                            <p className="mt-1 text-sm text-black/50">{route.seats}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="border-2 border-black bg-gray-100 p-4 shadow-soft">
                      <div className="flex items-center gap-3">
                        <Clock3 size={16} className="text-black" />
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                          Departure window
                        </p>
                      </div>
                      <p className="mt-3 text-lg font-black uppercase tracking-tight text-black">
                        {preview.window}
                      </p>
                    </div>

                    <div className="border-2 border-black bg-gray-100 p-4 shadow-soft">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-black" />
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                          Booking context
                        </p>
                      </div>
                      <p className="mt-3 text-lg font-black uppercase tracking-tight text-black">
                        Seats, fares, and driver detail stay visible
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-0 hidden md:block">
              <div className="panel px-4 py-3">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-black" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                      Seat pricing
                    </p>
                    <p className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-black">
                      Upfront per ride
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
