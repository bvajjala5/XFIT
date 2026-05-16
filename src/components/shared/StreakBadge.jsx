import React from 'react';
import { Flame } from 'lucide-react';
export default function StreakBadge({ streak }) {
  return (
    <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
      <Flame className="w-4 h-4 text-orange-400" />
      <span className="text-sm font-semibold">{streak} day streak</span>
    </div>
  );
}
