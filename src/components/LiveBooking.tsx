import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LiveBooking = () => {
  const [pickup, setPickup] = useState('Indiranagar, Bangalore');
  const [drop, setDrop] = useState('Koramangala, Bangalore');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <section className="py-32 bg-white overflow-hidden relative border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-stretch gap-16">
          
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-5xl md:text-7xl font-black text-black tracking-tighter mb-6 uppercase">
              Ready<br />When You Are.
            </h2>
            <p className="text-xl text-black font-medium mb-12 max-w-lg">
              Enter your destination to see upfront pricing and nearby riders you can share your journey with.
            </p>

            <div className="bg-white p-8 border-4 border-black shadow-premium">
              <form onSubmit={handleSearch} className="space-y-8 relative">
                
                {/* Visual Connection Line */}
                <div className="absolute left-4 top-[3rem] bottom-[6rem] w-0.5 bg-black z-0"></div>

                <div className="relative z-10 group">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Pickup</label>
                  <div className="flex items-center border-b-4 border-black pb-2 transition-colors focus-within:border-gray-500">
                    <div className="pr-4">
                      <div className="w-8 h-8 bg-black flex items-center justify-center">
                        <div className="w-2 h-2 bg-white"></div>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup location"
                      className="w-full bg-transparent border-none outline-none text-xl font-bold text-black placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="relative z-10 group">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Destination</label>
                  <div className="flex items-center border-b-4 border-black pb-2 transition-colors focus-within:border-gray-500">
                    <div className="pr-4">
                      <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                        <div className="w-2 h-2 bg-black"></div>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="Enter destination"
                      className="w-full bg-transparent border-none outline-none text-xl font-bold text-black placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSearching}
                  className="w-full mt-8 py-5 bg-black text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-colors shadow-soft flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isSearching ? 'Finding matches...' : 'See Prices'}
                  {!isSearching && <ArrowRight size={20} strokeWidth={2.5} className="ml-3 group-hover:translate-x-2 transition-transform" />}
                </button>
              </form>

              {/* Simulated Results */}
              <motion.div 
                initial={false}
                animate={{ height: isSearching ? 0 : 'auto', opacity: isSearching ? 0 : 1, marginTop: isSearching ? 0 : 32 }}
                className="overflow-hidden"
              >
                <div className="pt-8 border-t-4 border-black">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-bold uppercase tracking-widest text-black">Shared Ride</span>
                    <span className="text-2xl font-black text-black">₹145</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 bg-white p-4 border-2 border-black">
                    <div className="flex -space-x-3">
                      <div className="w-12 h-12 bg-black text-white flex items-center justify-center border-2 border-white font-bold text-sm z-10">A</div>
                      <div className="w-12 h-12 bg-gray-200 text-black flex items-center justify-center border-2 border-white font-bold text-sm">R</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-black">2 matches on route</p>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Save 40% vs solo ride</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative h-[600px] bg-white border-4 border-black shadow-premium overflow-hidden">
             {/* Brutalist Grid Pattern */}
             <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             
             {/* Map route visualization */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
               <motion.path 
                 d="M 100 450 Q 200 300 300 200 T 450 100" 
                 fill="none" 
                 stroke="#000000" 
                 strokeWidth="6"
                 strokeDasharray="12 12"
                 initial={{ pathLength: 0 }}
                 whileInView={{ pathLength: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 2, ease: "easeInOut" }}
               />
               <motion.rect 
                 x="85" y="435" width="30" height="30" fill="#000" stroke="#fff" strokeWidth="4"
                 initial={{ scale: 0 }}
                 whileInView={{ scale: 1 }}
                 transition={{ delay: 0 }}
               />
               <motion.rect 
                 x="435" y="85" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="4"
                 initial={{ scale: 0 }}
                 whileInView={{ scale: 1 }}
                 transition={{ delay: 2 }}
               />
             </svg>

             {/* Moving dot */}
             <motion.div 
                className="absolute z-20 w-6 h-6 bg-black border-4 border-white shadow-soft"
                animate={{
                  x: [100, 160, 250, 350, 450],
                  y: [450, 360, 260, 160, 100],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
             />

             {/* Floating Info */}
             <div className="absolute bottom-8 left-8 right-8 bg-white p-6 border-4 border-black shadow-soft flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Arriving at pickup</p>
                  <p className="text-2xl font-black text-black">3 MINS</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Driver</p>
                  <p className="text-lg font-bold text-black uppercase">Rahul Kumar</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LiveBooking;
