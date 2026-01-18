import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { BookMarked, Flame } from 'lucide-react';
import { usePlanner } from '../contexts/PlannerContext';
import { useToast } from '../contexts/ToastContext';

const StudyCommitmentCard = ({ weeklyHoursTracked = 0 }) => {
  const { studyCommitment, updateStudyCommitment } = usePlanner();
  const { showToast } = useToast();
  const [localTarget, setLocalTarget] = useState(studyCommitment.weeklyTarget);

  useEffect(() => {
    setLocalTarget(studyCommitment.weeklyTarget);
  }, [studyCommitment.weeklyTarget]);

  const progress = useMemo(() => {
    if (!localTarget || localTarget <= 0) return 0;
    return Math.min(Math.round((weeklyHoursTracked / localTarget) * 100), 100);
  }, [weeklyHoursTracked, localTarget]);

  const handleCommitmentSave = () => {
    updateStudyCommitment({ weeklyTarget: Number(localTarget) });
    showToast('Study commitment updated.', { type: 'success' });
  };

  const updatedLabel = studyCommitment.updatedAt
    ? formatDistanceToNow(new Date(studyCommitment.updatedAt), { addSuffix: true })
    : 'just now';

  return (
    <div className="stats-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Dedicated study block</p>
          <h2 className="text-xl font-semibold text-gray-900">Weekly commitment</h2>
        </div>
        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
          <Flame className="h-5 w-5 text-red-500" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>{weeklyHoursTracked.toFixed(1)}h logged</span>
          <span>Target: {localTarget}h</span>
        </div>
        <div className="progress-bar h-3">
          <div
            className="progress-fill h-3 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {progress >= 100 ? 'Commitment met. Brilliant momentum!' : `${Math.max(localTarget - weeklyHoursTracked, 0).toFixed(1)} hours remain this week.`}
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Set weekly study hours</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1"
            max="40"
            value={localTarget}
            onChange={(e) => setLocalTarget(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="w-14 text-right text-sm font-semibold text-gray-900">{localTarget}h</span>
        </div>
        <button
          type="button"
          onClick={handleCommitmentSave}
          className="btn-primary w-full"
        >
          Commit
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-blue-600" />
          Study intention
        </label>
        <textarea
          rows="3"
          className="input-field"
          value={studyCommitment.intention}
          onChange={(e) => updateStudyCommitment({ intention: e.target.value })}
          placeholder="Why does study time matter this week?"
        />
        <p className="text-xs text-gray-500">
          Updated {updatedLabel}
        </p>
      </div>
    </div>
  );
};

export default StudyCommitmentCard;
