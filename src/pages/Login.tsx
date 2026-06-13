import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Check if Firebase is actually configured, otherwise bypass for demo purposes
    if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "dummy-key") {
      try {
        setError('');
        setLoading(true);
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (err: any) {
        setError('Failed to log in: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Demo bypass when no Firebase config is present
      console.warn("Firebase not configured. Bypassing login for demonstration.");
      navigate('/');
    }
  };

  const handleGoogleSignIn = async () => {
    if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "dummy-key") {
      try {
        setError('');
        setLoading(true);
        await signInWithPopup(auth, googleProvider);
        navigate('/');
      } catch (err: any) {
        setError('Failed to log in with Google: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      console.warn("Firebase not configured. Bypassing Google login for demonstration.");
      navigate('/');
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 m-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h1>
        <p className="text-slate-500">Sign in to TaskSync to continue</p>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-medium border border-red-100 mb-6">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Email Address</label>
          <input 
            type="email" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required 
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Password</label>
          <input 
            type="password" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-slate-200"></div>
        <span className="px-4 text-sm text-slate-400 font-medium bg-white">OR</span>
        <div className="flex-1 border-t border-slate-200"></div>
      </div>

      <button 
        onClick={handleGoogleSignIn} 
        disabled={loading} 
        className="w-full py-3 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      
      <div className="mt-8 text-center text-slate-500 text-sm">
        Don't have an account? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 ml-1">Register here</Link>
      </div>
    </div>
  );
};

export default Login;
