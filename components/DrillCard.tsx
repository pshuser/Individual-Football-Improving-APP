import React from 'react';
import { Drill, Language } from '../types';
import { Clock, BarChart, ShoppingBag } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface DrillCardProps {
  drill: Drill;
  lang: Language;
}

const DrillCard: React.FC<DrillCardProps> = ({ drill, lang }) => {
  const t = TRANSLATIONS[lang];

  const getDifficultyColor = (diff: string) => {
    // We check against the English keys because the internal data model uses English enums
    switch (diff) {
      case 'Beginner': return 'text-green-500 dark:text-green-400';
      case 'Intermediate': return 'text-yellow-500 dark:text-yellow-400';
      case 'Advanced': return 'text-orange-500';
      case 'Pro': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  // Safe access for translations
  const categoryLabel = t.categories[drill.category as keyof typeof t.categories] || drill.category;
  const difficultyLabel = t.difficulties[drill.difficulty as keyof typeof t.difficulties] || drill.difficulty;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-lg hover:border-emerald-500/50 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 mb-2 border border-slate-200 dark:border-slate-600">
                {categoryLabel}
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{drill.title}</h3>
        </div>
      </div>
      
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
        {drill.description}
      </p>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{drill.duration}</span>
        </div>
        <div className="flex items-center gap-1">
          <BarChart size={14} />
          <span className={getDifficultyColor(drill.difficulty)}>{difficultyLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingBag size={14} />
          <span>{drill.equipment.join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

export default DrillCard;