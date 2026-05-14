import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Magnetic from './Magnetic';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 bg-white border-b-2 border-black overflow-hidden">
      {/* Brutalist Grid Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center space-x-3 border-2 border-black px-4 py-2 bg-white mb-10 shadow-soft">
                <span className="w-3 h-3 bg-black rounded-full animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-black">Live in Bengaluru & Mumbai</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-black leading-[0.85] mb-8 uppercase">
                Share.<br />
                Save.<br />
                Commute.
              </h1>
              
              <p className="text-xl md:text-2xl text-black font-medium leading-relaxed max-w-2xl mb-12 border-l-4 border-black pl-6">
                HopIn helps people across Indian cities share rides, split fares, and travel smarter. Join the community today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Magnetic>
                  <Link to="/auth" className="inline-flex justify-center items-center px-10 py-5 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black border-2 border-black transition-colors shadow-premium group">
                    Book a Ride
                    <ArrowRight size={20} strokeWidth={2.5} className="ml-3 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link to="/auth" className="inline-flex justify-center items-center px-10 py-5 bg-white text-black font-bold uppercase tracking-widest text-sm border-2 border-black hover:bg-black hover:text-white transition-colors shadow-soft">
                    Become a Driver
                  </Link>
                </Magnetic>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-[3/4] bg-white border-4 border-black shadow-premium flex flex-col justify-between p-8"
            >
              {/* Abstract decorative elements */}
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-black rounded-full"></div>
                <div className="text-right">
                  <p className="font-bold uppercase tracking-widest text-xs">Est. Fare</p>
                  <p className="text-4xl font-black">₹150</p>
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
                <p className="text-sm font-bold uppercase tracking-widest border-t-2 border-black pt-4">2 Matches Found</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
      
      {/* Scrolling Marquee text at the bottom of hero */}
      <div className="absolute bottom-0 left-0 w-full bg-black text-white py-3 overflow-hidden border-t-2 border-black flex whitespace-nowrap">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex space-x-12"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-sm font-bold uppercase tracking-widest">Minimal Commute. Maximum Savings.</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
