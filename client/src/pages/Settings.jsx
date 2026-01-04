import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, User, Target, Bell, Mail, Save, TestTube } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dailyGoalHours: 6,
    weeklyGoalHours: 40,
    emailNotifications: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dailyGoalHours: user.dailyGoalHours || 6,
        weeklyGoalHours: user.weeklyGoalHours || 40,
        emailNotifications: user.emailNotifications !== false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.put('/auth/settings', {
        dailyGoalHours: parseInt(formData.dailyGoalHours),
        weeklyGoalHours: parseInt(formData.weeklyGoalHours),
        emailNotifications: formData.emailNotifications
      });

      if (response.data.user) {
        updateUser(response.data.user);
        setMessage('Settings updated successfully!');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      setError(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await api.post('/notifications/test');
      setMessage('Test email sent successfully!');
    } catch (error) {
      console.error('Test email error:', error);
      setError('Failed to send test email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <div className="stats-card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Name cannot be changed</p>
                </div>
                
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              {message && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{message}</div>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Goal Settings */}
          <div className="stats-card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Study Goals</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Daily Goal (hours)</label>
                <input
                  type="number"
                  name="dailyGoalHours"
                  value={formData.dailyGoalHours}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  max="24"
                />
                <p className="text-sm text-gray-500 mt-1">Hours to study per day</p>
              </div>
              
              <div>
                <label className="form-label">Weekly Goal (hours)</label>
                <input
                  type="number"
                  name="weeklyGoalHours"
                  value={formData.weeklyGoalHours}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  max="168"
                />
                <p className="text-sm text-gray-500 mt-1">Hours to study per week</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="stats-card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive reminders and streak updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {formData.emailNotifications && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>Send Test Email</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="stats-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Member since</div>
                <div className="text-sm font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Current daily goal</div>
                <div className="text-sm font-medium text-gray-900">
                  {user?.dailyGoalHours || 6} hours
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Current weekly goal</div>
                <div className="text-sm font-medium text-gray-900">
                  {user?.weeklyGoalHours || 40} hours
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="stats-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>Consistency is key:</strong> Even 30 minutes daily is better than 3 hours once a week.
              </div>
              <div>
                <strong>Track everything:</strong> Log all your study sessions, no matter how short.
              </div>
              <div>
                <strong>Set realistic goals:</strong> Start small and gradually increase your daily target.
              </div>
              <div>
                <strong>Use the calendar:</strong> Visualize your progress and identify patterns.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
