import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { usePlanner } from '../contexts/PlannerContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import {
  Flame,
  Target,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Plus,
  ListChecks,
  BarChart3,
} from 'lucide-react';
import SessionModal from '../components/SessionModal';
import TaskBoard from '../components/TaskBoard';
import StudyCommitmentCard from '../components/StudyCommitmentCard';
import JournalPanel from '../components/JournalPanel';
import { useToast } from '../contexts/ToastContext';
import redFlame from '../assets/redflame.png';

const Dashboard = () => {
  const { user } = useAuth();
  const { streak, stats, isLoading, addSession, getSessionByDate, fetchWeeklyGoals } = useStreak();
  const { stats: plannerStats } = usePlanner();
  const { showToast } = useToast();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [todaySession, setTodaySession] = useState(null);
  const [todayHours, setTodayHours] = useState(0);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(0);
  
  const dailyGoal = user?.dailyGoalHours ?? 6;

  const loadTodaySession = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const result = await getSessionByDate(today);
    if (result.success) {
      setTodaySession(result.data);
      setTodayHours(result.data ? result.data.duration_minutes / 60 : 0);
    }
  }, [getSessionByDate]);

  const loadWeeklyStudyHours = useCallback(async () => {
    try {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(), { weekStartsOn: 1 });
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const data = await fetchWeeklyGoals(startStr, endStr);
      const currentWeek = data.find((week) => week.week_start === startStr);
      setWeeklyStudyHours(currentWeek?.actual_hours ? Number(currentWeek.actual_hours) : 0);
    } catch (error) {
      console.error('Failed to load weekly study hours', error);
      setWeeklyStudyHours(0);
    }
  }, [fetchWeeklyGoals]);

  useEffect(() => {
    loadTodaySession();
    loadWeeklyStudyHours();
  }, [loadTodaySession, loadWeeklyStudyHours]);

  const handleSessionSaved = async (sessionData) => {
    const result = await addSession(sessionData);
    if (result.success) {
      await loadTodaySession();
      await loadWeeklyStudyHours();
      setShowSessionModal(false);
      showToast('Session saved to your streak.', { type: 'success' });
      return result;
    } else {
      showToast(result.message || 'Failed to save session', { type: 'error' });
      throw new Error(result.message || 'Failed to save session');
    }
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal || goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getTodayProgress = () => {
    return getProgressPercentage(todayHours, dailyGoal);
  };

  const streakStatus = useMemo(() => {
    if (!streak) return { status: 'none', message: 'Log your first study block to start a streak.' };
    
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
  }, [streak]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[16rem]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gradient-to-br from-white to-blue-50 rounded-3xl border border-blue-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm text-blue-700 font-medium uppercase tracking-widest">Planner</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-gray-900">
                Hey {user?.name?.split(' ')[0] || 'there'}, what will you accomplish today?
              </h1>
              <p className="mt-3 text-gray-600 max-w-2xl">
                Keep your high-impact tasks, study commitment, and reflection in one workflow. Log a session once you protect a block of focused study time.
              </p>
            </div>
            <button
              onClick={() => setShowSessionModal(true)}
              className="btn-primary flex items-center justify-center space-x-2 w-full md:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Log study session</span>
            </button>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <ListChecks className="h-4 w-4 text-blue-500" />
                <span>Active tasks</span>
              </p>
              <p className="text-2xl font-semibold text-gray-900">{plannerStats.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Completed</span>
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {plannerStats.completed} <span className="text-sm text-gray-500">({plannerStats.completionRate}% done)</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-1">
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span>In progress</span>
              </p>
              <p className="text-2xl font-semibold text-gray-900">{plannerStats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="streak-card relative overflow-hidden">
            <img src={redFlame} alt="Flame icon" className="absolute right-4 top-4 w-12 opacity-70" />
            <div className="flex items-center justify-between relative">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="h-6 w-6" />
                  <span className="text-lg font-semibold">Current Streak</span>
                </div>
                <div className="text-4xl font-bold mb-1">{streak?.current_streak || 0} days</div>
                <div className="text-blue-100">{streakStatus.message}</div>
              </div>
              {streak?.longest_streak > 0 && (
                <div className="text-right">
                  <p className="text-sm text-blue-100">Longest</p>
                  <p className="text-xl font-semibold">{streak.longest_streak} days</p>
                </div>
              )}
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's study focus</h3>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Hours logged</span>
                  <span>{todayHours.toFixed(1)} / {dailyGoal}</span>
                </div>
                <div className="progress-bar h-3">
                  <div className="progress-fill h-3 rounded-full" style={{ width: `${getTodayProgress()}%` }}></div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {todayHours >= dailyGoal ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>{todayHours >= dailyGoal ? 'Goal achieved!' : 'Protect more focus time.'}</span>
              </div>
              {todaySession && (
                <div className="text-xs text-gray-500">
                  Last session: {todaySession.description || 'No description provided'}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <TaskBoard />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StudyCommitmentCard weeklyHoursTracked={weeklyStudyHours} />

          <div className="stats-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Planner insights</p>
                <h2 className="text-xl font-semibold text-gray-900">Weekly snapshot</h2>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tasks remaining</span>
                <span>{Math.max(plannerStats.total - plannerStats.completed, 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Study hours this week</span>
                <span>{weeklyStudyHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Daily goal</span>
                <span>{dailyGoal}h</span>
              </div>
            </div>
          </div>
        </div>

        <JournalPanel />
      </section>

      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stats-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.daily.daysGoalMet}</div>
                <div className="text-sm text-gray-600">Days goal met (last 30)</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.daily.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Daily success rate</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.daily.totalHours.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Hours tracked</div>
              </div>
            </div>
          </div>
        </section>
      )}

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
