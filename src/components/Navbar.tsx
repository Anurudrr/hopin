import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import Magnetic from './Magnetic';

const Navbar = () => {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            {/* Brutalist Logo Mark */}
            <div className="w-8 h-8 bg-black flex items-center justify-center transform group-hover:rotate-90 transition-transform duration-500 ease-in-out">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-3xl font-black tracking-tighter text-black uppercase">HopIn</span>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Magnetic>
              <Link to="/" className="text-black font-bold uppercase tracking-widest text-sm hover:underline decoration-2 underline-offset-4 hidden md:block">
                Ride
              </Link>
            </Magnetic>
            <Magnetic>
              <Link to="/" className="text-black font-bold uppercase tracking-widest text-sm hover:underline decoration-2 underline-offset-4 hidden md:block">
                Drive
              </Link>
            </Magnetic>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Magnetic>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-black font-bold uppercase tracking-widest text-sm hover:underline decoration-2 underline-offset-4"
                  >
                    <LogOut size={18} strokeWidth={2.5} />
                    <span className="hidden sm:block">Sign Out</span>
                  </button>
                </Magnetic>
              </div>
            ) : (
              <Magnetic>
                <Link 
                  to="/auth" 
                  className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black border-2 border-black transition-colors"
                >
                  Log In
                </Link>
              </Magnetic>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
