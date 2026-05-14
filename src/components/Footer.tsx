import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white pt-20 border-t-2 border-black overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="md:col-span-2">
            <h3 className="text-3xl font-black tracking-tighter text-black uppercase mb-6">HopIn</h3>
            <p className="text-black font-medium max-w-sm mb-8 border-l-4 border-black pl-4">
              A minimalist ride-sharing platform focused on what matters: moving you from A to B efficiently.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-black mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">Ride</Link></li>
              <li><Link to="/" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">Drive</Link></li>
              <li><Link to="/" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">Pricing</Link></li>
              <li><Link to="/" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">Cities</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-black mb-6">Connect</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">Instagram</a></li>
              <li><a href="#" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">Twitter</a></li>
              <li><a href="#" className="text-black hover:underline decoration-2 underline-offset-4 font-medium">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t-4 border-black py-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-widest text-black mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} HopIn Technologies.
          </p>
          <div className="flex space-x-8">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-black hover:underline decoration-2 underline-offset-4">Privacy</Link>
            <Link to="/" className="text-xs font-bold uppercase tracking-widest text-black hover:underline decoration-2 underline-offset-4">Terms</Link>
          </div>
        </div>
      </div>

      {/* Massive Typography Footer Mark */}
      <div className="w-full text-center bg-black py-4 select-none pointer-events-none overflow-hidden">
        <h1 className="text-[15vw] leading-[0.8] font-black text-white uppercase tracking-tighter m-0 -mb-[2vw]">
          HOPIN
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
