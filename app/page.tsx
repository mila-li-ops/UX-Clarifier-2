"use client"

import React, { useState } from 'react';
import { HomeView, AnalysisData } from '@/components/HomeView';
import { ProcessingView } from '@/components/ProcessingView';
import { ResultsView } from '@/components/ResultsView';
import { ErrorView } from '@/components/ErrorView';
import { useAuth } from '@/components/AuthProvider';
import { saveAnalysis } from '@/lib/firestore';

type AppState = 'HOME' | 'PROCESSING' | 'RESULTS' | 'ERROR';

const emptyData: AnalysisData = { title: '', featureComplexity: '', productType: '', platform: '', targetUsers: '', designStage: '', focusArea: [], featureText: '', files: [] };

export default function Page() {
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppState>('HOME');
  const [featureData, setFeatureData] = useState<AnalysisData>(emptyData);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<Error | string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');

  const extractFile = async (file: File): Promise<string> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const extractRes = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType: file.type }),
    });
    if (!extractRes.ok) {
      const { error } = await extractRes.json();
      throw new Error(error || 'Extraction failed');
    }
    const text = (await extractRes.json()).text;
    if (!text || !text.trim()) throw new Error(`No text could be extracted from "${file.name}".`);
    return text;
  };

  const runAnalysis = async (data: AnalysisData, clarificationNotes?: string) => {
    setAppState('PROCESSING');
    setError(null);
    setRawResponse(undefined);
    setExtractionError(false);

    try {
      let finalFeatureText = data.featureText;

      if (data.files.length > 0 && !clarificationNotes) {
        setIsExtracting(true);
        try {
          const parts: string[] = [];
          if (data.featureText.trim()) parts.push(data.featureText);

          for (const file of data.files) {
            const text = await extractFile(file);
            parts.push(`--- Extracted from: ${file.name} ---\n${text}`);
          }

          finalFeatureText = parts.join('\n\n');
          setExtractedText(finalFeatureText);
        } catch (err) {
          console.error("Extraction failed:", err);
          setExtractionError(true);
          setError(err as Error);
          setAppState('ERROR');
          setIsExtracting(false);
          return;
        }
        setIsExtracting(false);
      } else if (clarificationNotes && extractedText) {
        finalFeatureText = extractedText;
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureText: finalFeatureText, title: data.title, featureComplexity: data.featureComplexity, productType: data.productType, platform: data.platform, targetUsers: data.targetUsers, designStage: data.designStage, focusArea: data.focusArea, clarificationNotes }),
      });
      if (!analyzeRes.ok) {
        const { error, rawResponse } = await analyzeRes.json();
        const err: any = new Error(error || 'Analysis failed');
        err.rawResponse = rawResponse;
        throw err;
      }
      const result = await analyzeRes.json();
      const resolvedTitle = result.resolvedTitle || data.title || 'Untitled Feature';
      setAnalysisResult(result);
      setFeatureData({ ...data, title: resolvedTitle });
      setAppState('RESULTS');

      if (user) {
        saveAnalysis(user.uid, resolvedTitle, result).catch(console.error);
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err);
      if (err.rawResponse) {
        setRawResponse(err.rawResponse);
      } else if (err.message) {
        setRawResponse(err.message);
      }
      setAppState('ERROR');
      setIsExtracting(false);
    }
  };

  const handleRunAnalysis = (data: AnalysisData) => {
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

  const handleTryAnotherFile = () => {
    setFeatureData({ ...featureData, files: [] });
    setAppState('HOME');
  };

  const handlePasteText = () => {
    setFeatureData({ ...featureData, files: [] });
    setAppState('HOME');
  };

  const handleNewAnalysis = () => {
    setFeatureData(emptyData);
    setAnalysisResult(null);
    setExtractedText('');
    setAppState('HOME');
  };

  const handleOpenFromHistory = (result: any, title: string) => {
    setAnalysisResult(result);
    setFeatureData({ ...emptyData, title });
    setAppState('RESULTS');
  };

  if (appState === 'RESULTS') {
    return (
      <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-200">
        <ResultsView
          result={analysisResult}
          onRefine={handleRefine}
          onNewAnalysis={handleNewAnalysis}
          title={featureData?.title || 'Untitled Feature'}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-200 flex items-center justify-center">
      {appState === 'HOME' && (
        <HomeView
          onRunAnalysis={handleRunAnalysis}
          initialData={featureData}
          onOpenFromHistory={handleOpenFromHistory}
        />
      )}
      {appState === 'PROCESSING' && <ProcessingView isExtracting={isExtracting} hasFile={featureData?.files.length > 0} />}
      {appState === 'ERROR' && (
        <ErrorView
          error={error || "An unknown error occurred"}
          rawResponse={rawResponse}
          isExtractionError={extractionError}
          onRetry={handleRetry}
          onTryAnotherFile={handleTryAnotherFile}
          onPasteText={handlePasteText}
        />
      )}
    </main>
  );
}
