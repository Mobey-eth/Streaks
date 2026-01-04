import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { format, startOfWeek, endOfWeek, isToday, isThisWeek } from 'date-fns';
import { 
  Flame, 
  Target, 
  Clock, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3
} from 'lucide-react';
import SessionModal from '../components/SessionModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { streak, stats, isLoading, addSession, getSessionByDate } = useStreak();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [todaySession, setTodaySession] = useState(null);
  const [todayHours, setTodayHours] = useState(0);
  
  // Safe goal fallbacks if user isn't loaded yet
  const dailyGoal = user?.dailyGoalHours ?? 6;
  const weeklyGoal = user?.weeklyGoalHours ?? 40;

  useEffect(() => {
    loadTodaySession();
  }, []);

  const loadTodaySession = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const result = await getSessionByDate(today);
    if (result.success) {
      setTodaySession(result.data);
      setTodayHours(result.data ? result.data.duration_minutes / 60 : 0);
    }
  };

  const handleSessionSaved = async (sessionData) => {
    const result = await addSession(sessionData);
    if (result.success) {
      loadTodaySession();
      setShowSessionModal(false);
    } else {
      throw new Error(result.message || 'Failed to save session');
    }
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal || goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getWeekProgress = () => {
    if (!stats) return 0;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const isCurrentWeek = isThisWeek(new Date(), { weekStartsOn: 1 });
    
    if (!isCurrentWeek) return 0;
    
    return getProgressPercentage(stats.daily?.totalHours ?? 0, weeklyGoal);
  };

  const getTodayProgress = () => {
    return getProgressPercentage(todayHours, dailyGoal);
  };

  const getStreakStatus = () => {
    if (!streak) return { status: 'none', message: 'No streak data' };
    
    if (streak.current_streak === 0) {
      return { status: 'broken', message: 'Start a new streak today!' };
    }
    
    if (streak.current_streak >= 7) {
      return { status: 'excellent', message: 'Amazing streak!' };
    }
    
    if (streak.current_streak >= 3) {
      return { status: 'good', message: 'Great progress!' };
    }
    
    return { status: 'building', message: 'Keep it up!' };
  };

  const streakStatus = getStreakStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Track your daily study goals and maintain your streak</p>
        </div>
        <button
          onClick={() => setShowSessionModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Log Session</span>
        </button>
      </div>

      {/* Streak Card */}
      <div className="streak-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Flame className="h-6 w-6" />
              <span className="text-lg font-semibold">Current Streak</span>
            </div>
            <div className="text-4xl font-bold mb-1">{streak?.current_streak || 0}</div>
            <div className="text-blue-100">
              {streakStatus.message}
            </div>
            {streak?.longest_streak > 0 && (
              <div className="text-sm text-blue-100 mt-1">
                Best: {streak.longest_streak} days
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{streak?.current_streak || 0}</div>
            <div className="text-blue-100">days</div>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Hours studied</span>
                <span>{todayHours.toFixed(1)} / {dailyGoal}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getTodayProgress()}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {todayHours >= dailyGoal ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {todayHours >= dailyGoal ? 'Goal achieved!' : 'Keep going!'}
              </span>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Weekly progress</span>
                <span>{Number(stats?.daily?.totalHours ?? 0).toFixed(1)} / {weeklyGoal}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getWeekProgress()}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {Number(stats?.daily?.averageHoursPerDay ?? 0).toFixed(1)} hours/day average
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stats-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.daily.daysGoalMet}</div>
                <div className="text-sm text-gray-600">Days goal met</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.daily.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success rate</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.daily.totalHours.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Total hours</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="stats-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Log Study Session</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span>View Detailed Stats</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span>View Calendar</span>
          </button>
        </div>
      </div>

      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          onSave={handleSessionSaved}
          existingSession={todaySession}
        />
      )}
    </div>
  );
};

export default Dashboard;
