import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PlannerContext = createContext();

const STORAGE_KEYS = {
  tasks: 'streaks_planner_tasks',
  journal: 'streaks_planner_journal',
  studyCommitment: 'streaks_planner_commitment',
};

const DEFAULT_COMMITMENT = {
  weeklyTarget: 8,
  intention: 'Stay consistent and build meaningful progress.',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_TASKS = [
  {
    id: 'welcome-task-1',
    title: 'Outline focus tasks for the week',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'high',
    status: 'todo',
    category: 'Planning',
  },
  {
    id: 'welcome-task-2',
    title: 'Protect 2-hour study block',
    dueDate: null,
    priority: 'medium',
    status: 'in-progress',
    category: 'Study',
  },
];

const DEFAULT_JOURNAL = [
  {
    id: 'welcome-journal-1',
    body: 'Kick things off by writing what is top-of-mind for you today. Journaling keeps your streak grounded.',
    createdAt: new Date().toISOString(),
  },
];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};

const getStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const persistValue = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors (e.g., private mode)
  }
};

export const PlannerProvider = ({ children }) => {
  const [tasks, setTasks] = useState(() => {
    return getStoredValue(STORAGE_KEYS.tasks, DEFAULT_TASKS);
  });

  const [journalEntries, setJournalEntries] = useState(() => {
    return getStoredValue(STORAGE_KEYS.journal, DEFAULT_JOURNAL);
  });

  const [studyCommitment, setStudyCommitment] = useState(() => {
    return getStoredValue(STORAGE_KEYS.studyCommitment, DEFAULT_COMMITMENT);
  });

  useEffect(() => {
    persistValue(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.journal, journalEntries);
  }, [journalEntries]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.studyCommitment, studyCommitment);
  }, [studyCommitment]);

  const addTask = (task) => {
    const newTask = {
      ...task,
      id: createId(),
      status: task.status || 'todo',
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (taskId, updates) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
  };

  const updateTaskStatus = (taskId, status) => {
    updateTask(taskId, { status });
  };

  const removeTask = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const addJournalEntry = (body) => {
    if (!body?.trim()) return;
    const entry = {
      id: createId(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => [entry, ...prev].slice(0, 20));
  };

  const updateStudyCommitment = (updates) => {
    setStudyCommitment((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'done').length;
    const inProgress = tasks.filter((task) => task.status === 'in-progress').length;
    return {
      total: tasks.length,
      completed,
      inProgress,
      todo: tasks.filter((task) => task.status === 'todo').length,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  return (
    <PlannerContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        updateTaskStatus,
        removeTask,
        journalEntries,
        addJournalEntry,
        studyCommitment,
        updateStudyCommitment,
        stats,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};
