import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Clock, BookOpen, Save } from 'lucide-react';

const SessionModal = ({ isOpen, onClose, onSave, existingSession, selectedDate }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    durationMinutes: '',
    description: '',
    category: 'study'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingSession) {
      setFormData({
        date: existingSession.date,
        startTime: existingSession.start_time || '',
        endTime: existingSession.end_time || '',
        durationMinutes: existingSession.duration_minutes || '',
        description: existingSession.description || '',
        category: existingSession.category || 'study'
      });
    } else {
      setFormData({
        date: selectedDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        durationMinutes: '',
        description: '',
        category: 'study'
      });
    }
  }, [existingSession, selectedDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diffMinutes = Math.round((end - start) / (1000 * 60));
      if (diffMinutes > 0) {
        setFormData(prev => ({
          ...prev,
          durationMinutes: diffMinutes
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.date) {
        throw new Error('Date is required');
      }

      if (!formData.durationMinutes && !formData.startTime) {
        throw new Error('Either duration or start/end time is required');
      }

      // Calculate duration if not provided
      let duration = parseInt(formData.durationMinutes) || 0;
      if (formData.startTime && formData.endTime && !formData.durationMinutes) {
        const start = new Date(`2000-01-01T${formData.startTime}`);
        const end = new Date(`2000-01-01T${formData.endTime}`);
        duration = Math.round((end - start) / (1000 * 60));
      }

      if (duration <= 0) {
        throw new Error('Duration must be greater than 0');
      }

      const sessionData = {
        date: formData.date,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        durationMinutes: duration,
        description: formData.description,
        category: formData.category
      };

      // Call the onSave function passed as prop
      const result = await onSave(sessionData);
      
      if (result && !result.success) {
        throw new Error(result.message || 'Failed to save session');
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingSession ? 'Edit Session' : 'Log Study Session'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                onBlur={calculateDuration}
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                onBlur={calculateDuration}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Duration (minutes)</label>
            <input
              type="number"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              className="input-field"
              min="1"
              placeholder="Enter duration in minutes"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.durationMinutes ? `${(formData.durationMinutes / 60).toFixed(1)} hours` : ''}
            </p>
          </div>

          <div>
            <label className="form-label">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
            >
              <option value="study">Study</option>
              <option value="work">Work</option>
              <option value="practice">Practice</option>
              <option value="reading">Reading</option>
              <option value="coding">Coding</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="form-label">Description (optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows="3"
              placeholder="What did you study or work on?"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{existingSession ? 'Update' : 'Save'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
