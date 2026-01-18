import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ListPlus, PlayCircle, Trash2 } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useToast } from '../contexts/ToastContext';

const STATUSES = [
  { key: 'todo', label: 'To do', accent: 'border-blue-100', ring: 'ring-blue-50' },
  { key: 'in-progress', label: 'In progress', accent: 'border-amber-100', ring: 'ring-amber-50' },
  { key: 'done', label: 'Done', accent: 'border-emerald-100', ring: 'ring-emerald-50' },
];

const priorityBadge = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-emerald-50 text-emerald-600',
};

const statusOrder = STATUSES.map((status) => status.key);

const TaskBoard = () => {
  const { tasks, addTask, updateTaskStatus, removeTask } = usePlanner();
  const { showToast } = useToast();
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    priority: 'medium',
    category: 'Focus',
  });

  const groupedTasks = useMemo(() => {
    return STATUSES.reduce((acc, column) => {
      acc[column.key] = tasks.filter((task) => task.status === column.key);
      return acc;
    }, {});
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      showToast('Add a task name before saving.', { type: 'error' });
      return;
    }

    addTask({
      title: newTask.title.trim(),
      dueDate: newTask.dueDate || null,
      priority: newTask.priority,
      category: newTask.category,
    });
    
    showToast('Task added to your planner.', { type: 'success' });
    setNewTask({ title: '', dueDate: '', priority: 'medium', category: 'Focus' });
  };

  const advanceTask = (task) => {
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = Math.min(currentIndex + 1, statusOrder.length - 1);
    const nextStatus = statusOrder[nextIndex];
    if (nextStatus !== task.status) {
      updateTaskStatus(task.id, nextStatus);
      showToast(`Moved to ${STATUSES[nextIndex].label}`, { type: 'info' });
    }
  };

  const handleRemoveTask = (taskId) => {
    removeTask(taskId);
    showToast('Task removed.', { type: 'info' });
  };

  return (
    <div className="stats-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Plan your day</p>
          <h2 className="text-xl font-semibold text-gray-900">Focus Board</h2>
        </div>
        <div className="inline-flex items-center text-sm text-gray-600">
          <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2" />
          {tasks.filter((task) => task.status === 'done').length} of {tasks.length || 0} complete
        </div>
      </div>

      <form onSubmit={handleAddTask} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Add a task that keeps you moving..."
            className="input-field md:col-span-3"
            value={newTask.title}
            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            type="date"
            className="input-field md:col-span-1"
            value={newTask.dueDate}
            onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
          <select
            className="input-field"
            value={newTask.priority}
            onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            type="submit"
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <ListPlus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((column) => (
          <div
            key={column.key}
            className={`rounded-2xl border ${column.accent} ${column.ring} bg-gray-50/80 p-4 space-y-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{column.label}</p>
              <span className="text-xs text-gray-500">{groupedTasks[column.key]?.length || 0}</span>
            </div>

            <div className="space-y-3">
              {(groupedTasks[column.key] || []).length === 0 && (
                <div className="text-xs text-gray-500 bg-white rounded-xl p-3 border border-dashed border-gray-200">
                  Nothing here yet.
                </div>
              )}

              {(groupedTasks[column.key] || []).map((task) => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      {task.category && (
                        <p className="text-xs text-gray-500 mt-0.5">{task.category}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${priorityBadge[task.priority] || priorityBadge.medium}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {task.dueDate ? (
                      <div className="inline-flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        {task.dueDate}
                      </div>
                    ) : (
                      <div className="inline-flex items-center">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        No deadline
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      {task.status !== 'done' && (
                        <button
                          type="button"
                          onClick={() => advanceTask(task)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Move
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;

