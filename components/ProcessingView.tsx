"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';

const stages = [
  "Extracting assumptions...",
  "Detecting risk scenarios...",
  "Predicting UX failures...",
  "Estimating rework probability...",
  "Finalizing report..."
];

export function ProcessingView() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-8">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Analyzing Feature</h2>
        <p className="text-slate-500">Please wait while we validate your feature clarity.</p>
      </div>

      <Card className="w-full max-w-md border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          {stages.map((stage, index) => {
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isPending = index > currentStage;

            return (
              <div key={stage} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-slate-900 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${isCompleted ? 'text-slate-900' : isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
