import { useState, useEffect } from 'react';
import { useStreak } from '../contexts/StreakContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import SessionModal from '../components/SessionModal';

const Calendar = () => {
  const { fetchCalendarData, addSession, updateSession, deleteSession } = useStreak();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await fetchCalendarData(year, month);
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const session = calendarData.find(item => item.date === dateStr);
    setSelectedDate(dateStr);
    setSelectedSession(session || null);
    setShowSessionModal(true);
  };

  const handleSessionSaved = async (sessionData) => {
    let result;
    if (selectedSession) {
      result = await updateSession(selectedSession.id, sessionData);
    } else {
      result = await addSession(sessionData);
    }
    
    if (result.success) {
      loadCalendarData();
      setShowSessionModal(false);
      setSelectedDate(null);
      setSelectedSession(null);
    } else {
      throw new Error(result.message || 'Failed to save session');
    }
  };

  const getDayData = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarData.find(item => item.date === dateStr);
  };

  const getDayStatus = (date) => {
    const dayData = getDayData(date);
    if (!dayData) return 'no-data';
    
    if (dayData.goal_met) return 'goal-met';
    if (dayData.actual_hours > 0) return 'partial';
    return 'goal-not-met';
  };

  const getDayHours = (date) => {
    const dayData = getDayData(date);
    return dayData ? dayData.actual_hours : 0;
  };

  const getDayDescription = (date) => {
    const dayData = getDayData(date);
    return dayData ? dayData.description : '';
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    // Adjust to show full weeks
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(endDate);
    end.setDate(end.getDate() + (6 - end.getDay()));
    
    const days = eachDayOfInterval({ start, end });
    
    return days.map((day, index) => {
      const isCurrentMonth = isSameMonth(day, currentDate);
      const isTodayDate = isToday(day);
      const dayStatus = getDayStatus(day);
      const dayHours = getDayHours(day);
      const dayDescription = getDayDescription(day);
      
      return (
        <div
          key={index}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${
            isTodayDate ? 'today' : ''
          } ${dayStatus}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-sm font-medium">{format(day, 'd')}</span>
            {dayStatus === 'goal-met' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {dayStatus === 'goal-not-met' && dayHours > 0 && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            {dayStatus === 'partial' && (
              <Clock className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          {dayHours > 0 && (
            <div className="text-xs text-gray-600">
              {dayHours.toFixed(1)}h
            </div>
          )}
          
          {dayDescription && (
            <div className="text-xs text-gray-500 truncate" title={dayDescription}>
              {dayDescription}
            </div>
          )}
          
          {isCurrentMonth && dayHours === 0 && (
            <button className="mt-1 p-1 text-gray-400 hover:text-gray-600">
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    });
  };

  const getMonthStats = () => {
    const monthData = calendarData.filter(item => 
      isSameMonth(new Date(item.date), currentDate)
    );
    
    const totalDays = monthData.length;
    const goalMetDays = monthData.filter(item => item.goal_met).length;
    const totalHours = monthData.reduce((sum, item) => sum + (item.actual_hours || 0), 0);
    
    return {
      totalDays,
      goalMetDays,
      totalHours: totalHours.toFixed(1),
      successRate: totalDays > 0 ? ((goalMetDays / totalDays) * 100).toFixed(1) : 0
    };
  };

  const stats = getMonthStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Calendar</h1>
          <p className="text-gray-600">Track your daily progress and maintain your streak</p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
            setSelectedSession(null);
            setShowSessionModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Log Session</span>
        </button>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="text-2xl font-bold text-gray-900">{stats.goalMetDays}</div>
          <div className="text-sm text-gray-600">Days goal met</div>
        </div>
        <div className="stats-card">
          <div className="text-2xl font-bold text-gray-900">{stats.successRate}%</div>
          <div className="text-sm text-gray-600">Success rate</div>
        </div>
        <div className="stats-card">
          <div className="text-2xl font-bold text-gray-900">{stats.totalHours}</div>
          <div className="text-sm text-gray-600">Total hours</div>
        </div>
        <div className="stats-card">
          <div className="text-2xl font-bold text-gray-900">{stats.totalDays}</div>
          <div className="text-sm text-gray-600">Days tracked</div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="calendar-grid">
          {/* Calendar Header */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="calendar-header">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {isLoading ? (
            <div className="col-span-7 flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderCalendarDays()
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Goal met</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Goal not met</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Partial progress</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Today</span>
        </div>
      </div>

      {/* Session Modal */}
      {showSessionModal && (
        <SessionModal
          isOpen={showSessionModal}
          onClose={() => {
            setShowSessionModal(false);
            setSelectedDate(null);
            setSelectedSession(null);
          }}
          onSave={handleSessionSaved}
          existingSession={selectedSession}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default Calendar;
