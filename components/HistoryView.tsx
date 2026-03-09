"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getAnalyses, SavedAnalysis } from '@/lib/firestore';
import { Button } from '@/components/ui/button';

interface HistoryViewProps {
  onBack: () => void;
  onOpen: (result: any, title: string) => void;
}

export function HistoryView({ onBack, onOpen }: HistoryViewProps) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAnalyses(user.uid)
      .then(setAnalyses)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Analysis History</h1>

      {loading && (
        <p className="text-sm text-slate-400">Loading...</p>
      )}

      {!loading && analyses.length === 0 && (
        <p className="text-sm text-slate-400">No saved analyses yet. Run your first analysis to see it here.</p>
      )}

      {!loading && analyses.length > 0 && (
        <div className="flex flex-col gap-2">
          {analyses.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpen(item.result, item.title)}
              className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-slate-400 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title || 'Untitled Feature'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <p className="text-xs text-slate-400">{item.createdAt.toLocaleString()}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
