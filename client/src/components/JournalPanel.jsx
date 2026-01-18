import { useState } from 'react';
import { format } from 'date-fns';
import { NotebookPen, Sparkles } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useToast } from '../contexts/ToastContext';

const JournalPanel = () => {
  const { journalEntries, addJournalEntry } = usePlanner();
  const { showToast } = useToast();
  const [entry, setEntry] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!entry.trim()) {
      showToast('Write a quick note before saving.', { type: 'error' });
      return;
    }

    addJournalEntry(entry);
    setEntry('');
    showToast('Journal entry saved.', { type: 'success' });
  };

  return (
    <div className="stats-card space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Reflect and capture</p>
          <h2 className="text-xl font-semibold text-gray-900">Quick journal</h2>
        </div>
        <Sparkles className="h-5 w-5 text-purple-500" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows="3"
          className="input-field"
          placeholder="Use this space to jot down intentions, wins or blockers..."
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <NotebookPen className="h-4 w-4" />
          <span>Save note</span>
        </button>
      </form>

      <div className="space-y-3 max-h-[18rem] overflow-y-auto pr-1">
        {journalEntries.length === 0 && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
            Your future self will thank you for leaving breadcrumbs.
          </div>
        )}

        {journalEntries.map((note) => (
          <div key={note.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-800 whitespace-pre-line">{note.body}</p>
            <p className="text-xs text-gray-500 mt-2">
              {format(new Date(note.createdAt), 'PPp')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalPanel;
