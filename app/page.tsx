"use client"

import React, { useState } from 'react';
import { HomeView } from '@/components/HomeView';
import { ProcessingView } from '@/components/ProcessingView';
import { ResultsView } from '@/components/ResultsView';
import { ErrorView } from '@/components/ErrorView';
import { analyzeFeature } from '@/lib/gemini';

type AppState = 'HOME' | 'PROCESSING' | 'RESULTS' | 'ERROR';

export default function Page() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [featureData, setFeatureData] = useState<{ title: string; context: string; featureText: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<Error | string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);

  const runAnalysis = async (data: { title: string; context: string; featureText: string }, clarificationNotes?: string) => {
    setAppState('PROCESSING');
    setError(null);
    setRawResponse(undefined);

    try {
      const result = await analyzeFeature(data.featureText, data.title, data.context, clarificationNotes);
      setAnalysisResult(result);
      setAppState('RESULTS');
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err);
      if (err.rawResponse) {
        setRawResponse(err.rawResponse);
      } else if (err.message) {
        setRawResponse(err.message);
      }
      setAppState('ERROR');
    }
  };

  const handleRunAnalysis = (data: { title: string; context: string; featureText: string }) => {
    setFeatureData(data);
    runAnalysis(data);
  };

  const handleRefine = (clarificationNotes: string) => {
    if (featureData) {
      runAnalysis(featureData, clarificationNotes);
    }
  };

  const handleRetry = () => {
    if (featureData) {
      runAnalysis(featureData);
    } else {
      setAppState('HOME');
    }
  };

  const handleNewAnalysis = () => {
    setFeatureData(null);
    setAnalysisResult(null);
    setAppState('HOME');
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-200">
      {appState === 'HOME' && <HomeView onRunAnalysis={handleRunAnalysis} />}
      {appState === 'PROCESSING' && <ProcessingView />}
      {appState === 'RESULTS' && (
        <ResultsView 
          result={analysisResult} 
          onRefine={handleRefine} 
          onNewAnalysis={handleNewAnalysis}
          title={featureData?.title || 'Untitled Feature'}
        />
      )}
      {appState === 'ERROR' && (
        <ErrorView 
          error={error || "An unknown error occurred"} 
          rawResponse={rawResponse} 
          onRetry={handleRetry} 
        />
      )}
    </main>
  );
}
