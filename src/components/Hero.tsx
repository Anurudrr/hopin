import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { supportedCities } from "../content/siteContent";
import Magnetic from "./Magnetic";

const Hero = () => {
  return (
    <section className="relative overflow-hidden border-b-2 border-black bg-white pb-20 pt-32 md:pb-32 md:pt-40">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "100px 100px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-10 inline-flex items-center space-x-3 border-2 border-black bg-white px-4 py-2 shadow-soft">
                <span className="h-3 w-3 animate-pulse rounded-full bg-black" />
                <span className="text-xs font-bold uppercase tracking-widest text-black">
                  Live across {supportedCities.length} Indian cities
                </span>
              </div>

              <h1 className="mb-8 text-6xl font-black uppercase leading-[0.85] tracking-tighter text-black md:text-8xl lg:text-[10rem]">
                Share.
                <br />
                Save.
                <br />
                Commute.
              </h1>

              <p className="mb-12 max-w-2xl border-l-4 border-black pl-6 text-xl font-medium leading-relaxed text-black md:text-2xl">
                Compare live shared routes, review per-seat pricing, and book against real
                published rides instead of placeholder matching.
              </p>

              <div className="flex flex-col gap-6 sm:flex-row">
                <Magnetic>
                  <Link
                    to="/book"
                    className="group inline-flex items-center justify-center border-2 border-black bg-black px-10 py-5 text-sm font-bold uppercase tracking-widest text-white transition-colors shadow-premium hover:bg-white hover:text-black"
                  >
                    Open Live Rides
                    <ArrowRight
                      size={20}
                      strokeWidth={2.5}
                      className="ml-3 transition-transform group-hover:translate-x-2"
                    />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    to="/driver-signup"
                    className="inline-flex items-center justify-center border-2 border-black bg-white px-10 py-5 text-sm font-bold uppercase tracking-widest text-black transition-colors shadow-soft hover:bg-black hover:text-white"
                  >
                    Driver Application
                  </Link>
                </Magnetic>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:col-span-4 lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex aspect-[3/4] w-full flex-col justify-between border-4 border-black bg-white p-8 shadow-premium"
            >
              <div className="flex items-start justify-between">
                <div className="h-16 w-16 rounded-full bg-black" />
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest">Example Fare</p>
                  <p className="text-4xl font-black">Rs 150</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-2 w-full bg-gray-200">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full bg-black"
                  />
                </div>
                <p className="border-t-2 border-black pt-4 text-sm font-bold uppercase tracking-widest">
                  Live route inventory by city
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 flex w-full overflow-hidden whitespace-nowrap border-t-2 border-black bg-black py-3 text-white">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex space-x-12"
        >
          {[...Array(10)].map((_, index) => (
            <span key={index} className="text-sm font-bold uppercase tracking-widest">
              Clearer routes. Fairer seats. Better commute software.
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
