import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import blueFlame from '../assets/blueflame.png';
import redFlame from '../assets/redflame.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      showToast('Welcome back! Planner unlocked.', { type: 'success' });
      navigate('/dashboard');
    } else {
      const fallbackMessage = result.message || 'Invalid email or password';
      setError(fallbackMessage);
      showToast(fallbackMessage, { type: 'error', duration: 5000 });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-offwhite flex items-center">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-6 py-10 sm:px-12">
            <div className="flex items-center space-x-3 mb-10">
              <img src={blueFlame} alt="Streaks planner logo" className="h-12 w-12" />
              <div>
                <p className="text-xl font-semibold text-gray-900">Streaks Planner</p>
                <p className="text-sm text-gray-500">Stay on task. Protect your streak.</p>
              </div>
            </div>

            <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
              Log back in to keep your tasks and study promises on track.
            </h1>
            <p className="mt-3 text-gray-600">
              Organize daily tasks, hold yourself to a weekly study commitment, and capture notes that keep your head clear.
            </p>
              <div className="mt-10 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span>Secure & private</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span>Streak-first design</span>
                </div>
              </div>
          </div>

          <div className="bg-gray-50 px-6 py-10 sm:px-12">
            <div className="max-w-md mx-auto space-y-8">
              <div className="flex justify-end">
                <img src={redFlame} alt="Streak icon" className="h-12 w-12" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
                <p className="mt-2 text-sm text-gray-600">
                  New here?{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Create an account
                  </Link>
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field"
                    placeholder="you@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="input-field pr-10"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
