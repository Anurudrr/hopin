import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mapAuthErrorMessage } from '../lib/errors';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Min 6 chars" }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Min 2 chars" }),
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Min 6 chars" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const { user, profile, loading, signIn, signUp } = useAuthStore();

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerSignup, handleSubmit: handleSignupSubmit, formState: { errors: signupErrors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></span>
      </div>
    );
  }

  if (user) {
    return <Navigate to={profile?.onboarding_completed ? "/dashboard" : "/onboarding"} replace />;
  }

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await signIn(data.email, data.password);
    } catch (err: any) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await signUp(data.email, data.password, data.name);
      setSuccessMsg('Check your email to confirm your account before signing in.');
    } catch (err: any) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-white py-20 px-4 sm:px-6 lg:px-8 mt-20 relative overflow-hidden">
      {/* Brutalist Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white p-10 border-4 border-black shadow-premium relative z-10"
      >
        <div className="mb-10 text-center border-b-4 border-black pb-8">
          <h2 className="text-4xl sm:text-6xl font-black text-black tracking-tighter uppercase mb-2">
            {isLogin ? "Enter." : "Join."}
          </h2>
          <p className="text-black font-bold uppercase tracking-widest text-xs">
            {isLogin ? "Welcome back to HopIn" : "Start your journey today"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 bg-black text-white font-bold uppercase tracking-widest text-xs text-center border-2 border-black"
          >
            ERROR: {error}
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-4 bg-white text-black font-bold uppercase tracking-widest text-xs text-center border-2 border-black"
          >
            SUCCESS: {successMsg}
          </motion.div>
        )}

        <div className="relative">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit(onLogin)} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2">Email</label>
                  <input 
                    {...registerLogin('email')}
                    type="email"
                    placeholder="YOU@EXAMPLE.COM"
                    className="w-full px-4 py-4 bg-transparent border-2 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-black/20 transition-all uppercase placeholder:text-gray-300"
                  />
                  {loginErrors.email && <p className="mt-2 text-xs font-bold uppercase text-black bg-gray-200 inline-block px-2 py-1">{loginErrors.email.message}</p>}
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-black">Password</label>
                    <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:underline underline-offset-4">Forgot?</a>
                  </div>
                  <input 
                    {...registerLogin('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-4 bg-transparent border-2 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-black/20 transition-all placeholder:text-gray-300"
                  />
                  {loginErrors.password && <p className="mt-2 text-xs font-bold uppercase text-black bg-gray-200 inline-block px-2 py-1">{loginErrors.password.message}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-5 px-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-colors shadow-soft flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed mt-8"
                >
                  {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                  {!isLoading && <ArrowRight size={20} strokeWidth={2.5} className="ml-3 group-hover:translate-x-2 transition-transform" />}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignupSubmit(onSignup)} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2">Full Name</label>
                  <input 
                    {...registerSignup('name')}
                    type="text"
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-4 bg-transparent border-2 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-black/20 transition-all uppercase placeholder:text-gray-300"
                  />
                  {signupErrors.name && <p className="mt-2 text-xs font-bold uppercase text-black bg-gray-200 inline-block px-2 py-1">{signupErrors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2">Email</label>
                  <input 
                    {...registerSignup('email')}
                    type="email"
                    placeholder="YOU@EXAMPLE.COM"
                    className="w-full px-4 py-4 bg-transparent border-2 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-black/20 transition-all uppercase placeholder:text-gray-300"
                  />
                  {signupErrors.email && <p className="mt-2 text-xs font-bold uppercase text-black bg-gray-200 inline-block px-2 py-1">{signupErrors.email.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black mb-2">Password</label>
                  <input 
                    {...registerSignup('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-4 bg-transparent border-2 border-black text-black font-bold focus:outline-none focus:ring-4 focus:ring-black/20 transition-all placeholder:text-gray-300"
                  />
                  {signupErrors.password && <p className="mt-2 text-xs font-bold uppercase text-black bg-gray-200 inline-block px-2 py-1">{signupErrors.password.message}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-5 px-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-colors shadow-soft flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed mt-8"
                >
                  {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  {!isLoading && <ArrowRight size={20} strokeWidth={2.5} className="ml-3 group-hover:translate-x-2 transition-transform" />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 border-t-4 border-black pt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {isLogin ? "DON'T HAVE AN ACCOUNT?" : "ALREADY HAVE AN ACCOUNT?"}{' '}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-black hover:underline underline-offset-4 ml-2"
            >
              {isLogin ? 'SIGN UP' : 'LOG IN'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
