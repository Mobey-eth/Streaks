import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const StreakContext = createContext();

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};

export const StreakProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [streak, setStreak] = useState(null);
  const [dailyGoals, setDailyGoals] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStreakData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [streakRes, statsRes] = await Promise.all([
        api.get('/streaks'),
        api.get('/streaks/stats?days=30')
      ]);
      
      setStreak(streakRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStreakData();
    }
  }, [isAuthenticated, fetchStreakData]);

  const fetchDailyGoals = useCallback(async (startDate, endDate) => {
    try {
      const response = await api.get(`/streaks/daily-goals?startDate=${startDate}&endDate=${endDate}`);
      setDailyGoals(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch daily goals:', error);
      return [];
    }
  }, []);

  const fetchWeeklyGoals = useCallback(async (startDate, endDate) => {
    try {
      const response = await api.get(`/streaks/weekly-goals?startDate=${startDate}&endDate=${endDate}`);
      setWeeklyGoals(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weekly goals:', error);
      return [];
    }
  }, []);

  const fetchCalendarData = useCallback(async (year, month) => {
    try {
      const response = await api.get(`/streaks/calendar?year=${year}&month=${month}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      return [];
    }
  }, []);

  const addSession = useCallback(async (sessionData) => {
    try {
      const response = await api.post('/sessions', sessionData);
      // Refresh streak data after adding session
      await fetchStreakData();
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to add session:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add session' 
      };
    }
  }, [fetchStreakData]);

  const updateSession = useCallback(async (sessionId, sessionData) => {
    try {
      const response = await api.put(`/sessions/${sessionId}`, sessionData);
      // Refresh streak data after updating session
      await fetchStreakData();
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update session:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update session' 
      };
    }
  }, [fetchStreakData]);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      // Refresh streak data after deleting session
      await fetchStreakData();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete session:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete session' 
      };
    }
  }, [fetchStreakData]);

  const getSessionByDate = useCallback(async (date) => {
    try {
      const response = await api.get(`/sessions/date/${date}`);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: null };
      }
      console.error('Failed to get session:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to get session' 
      };
    }
  }, []);

  const value = {
    streak,
    dailyGoals,
    weeklyGoals,
    stats,
    isLoading,
    fetchStreakData,
    fetchDailyGoals,
    fetchWeeklyGoals,
    fetchCalendarData,
    addSession,
    updateSession,
    deleteSession,
    getSessionByDate
  };

  return (
    <StreakContext.Provider value={value}>
      {children}
    </StreakContext.Provider>
  );
};
