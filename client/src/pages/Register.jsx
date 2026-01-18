import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, CheckCircle2, Target } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import blueFlame from '../assets/blueflame.png';
import redFlame from '../assets/redflame.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dailyGoalHours: 6,
    weeklyGoalHours: 40,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, isAuthenticated } = useAuth();
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
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      dailyGoalHours: parseInt(formData.dailyGoalHours),
      weeklyGoalHours: parseInt(formData.weeklyGoalHours),
    });
    
    if (result.success) {
      showToast('Account created! Refresh your streak with intention.', { type: 'success' });
      navigate('/dashboard');
    } else {
      setError(result.message);
      showToast(result.message || 'Registration failed', { type: 'error' });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-offwhite flex items-center">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-10 sm:px-12">
            <div className="flex items-center space-x-3 mb-10">
              <img src={redFlame} alt="Streaks icon" className="h-12 w-12" />
              <div>
                <p className="text-xl font-semibold text-gray-900">Build your streak</p>
                <p className="text-sm text-gray-500">Plan tasks, then honor study time.</p>
              </div>
            </div>

            <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
              Join Streaks Planner and turn daily effort into unstoppable momentum.
            </h1>
            <div className="mt-8 space-y-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-500" />
                <div>
                  <p className="font-semibold text-gray-900">Task-first dashboard</p>
                  <p>Organize priorities with clear pipelines and quick adds.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Study commitments</p>
                  <p>Dedicate a weekly study quota and track it alongside work.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-10 sm:px-12">
            <div className="flex items-center space-x-3 mb-8">
              <img src={blueFlame} alt="Streaks planner logo" className="h-12 w-12" />
              <div>
                <p className="text-xl font-semibold text-gray-900">Create account</p>
                <p className="text-sm text-gray-500">
                  Already have one?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input-field"
                    placeholder="First & last name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="input-field pr-10"
                      placeholder="At least 6 characters"
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
                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input-field"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dailyGoalHours" className="form-label">
                    Daily Focus (hours)
                  </label>
                  <input
                    id="dailyGoalHours"
                    name="dailyGoalHours"
                    type="number"
                    min="1"
                    max="24"
                    required
                    className="input-field"
                    value={formData.dailyGoalHours}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Ideal daily deep-work time.</p>
                </div>
                <div>
                  <label htmlFor="weeklyGoalHours" className="form-label">
                    Weekly Study Goal
                  </label>
                  <input
                    id="weeklyGoalHours"
                    name="weeklyGoalHours"
                    type="number"
                    min="1"
                    max="168"
                    required
                    className="input-field"
                    value={formData.weeklyGoalHours}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Exclusive to studying or learning.</p>
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
                  <span>Create account</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

