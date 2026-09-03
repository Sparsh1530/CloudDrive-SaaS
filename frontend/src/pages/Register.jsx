import { useState } from 'react';
import API from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { HardDrive } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Fixed: Send both 'name' and 'fullName' so Spring Boot DTO matches regardless of field naming
      const payload = {
        name: fullName,
        fullName: fullName,
        email: email,
        password: password
      };

      await API.post('/auth/register', payload);
      alert('Registration successful! Redirecting to login...');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      const errMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || 'Registration failed. Email might already exist.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070913] text-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-[#12162e] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-purple-900/40">
        <div className="flex items-center justify-center gap-3 text-purple-400 font-extrabold text-2xl mb-6">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <HardDrive className="w-7 h-7 text-purple-400" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400">
            CloudDrive
          </span>
        </div>

        <h2 className="text-xl font-bold mb-6 text-center text-white">Create Account</h2>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
          <input 
            type="text" 
            required 
            className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none focus:border-purple-500" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="John Doe"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
          <input 
            type="email" 
            required 
            className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none focus:border-purple-500" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="name@example.com"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
          <input 
            type="password" 
            required 
            className="w-full bg-[#090b16] border border-purple-900/30 rounded-xl p-2.5 text-sm text-white outline-none focus:border-purple-500" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-xs text-center mt-5 text-gray-400">
          Already have an account? <Link to="/login" className="text-purple-400 font-semibold hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
}