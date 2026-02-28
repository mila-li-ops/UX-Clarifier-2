"use client"

import React, { useState } from 'react';
import { HomeView } from '@/components/HomeView';
import { ProcessingView } from '@/components/ProcessingView';
import { ResultsView } from '@/components/ResultsView';
import { ErrorView } from '@/components/ErrorView';
import { analyzeFeature, extractContentFromImage, extractContentFromDocument } from '@/lib/gemini';

type AppState = 'HOME' | 'PROCESSING' | 'RESULTS' | 'ERROR';

export default function Page() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [featureData, setFeatureData] = useState<{ title: string; context: string; featureText: string; file: File | null }>({ title: '', context: '', featureText: '', file: null });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<Error | string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | undefined>(undefined);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');

  const runAnalysis = async (data: { title: string; context: string; featureText: string; file: File | null }, clarificationNotes?: string) => {
    setAppState('PROCESSING');
    setError(null);
    setRawResponse(undefined);
    setExtractionError(false);

    try {
      let finalFeatureText = data.featureText;

      if (data.file && !clarificationNotes) {
        setIsExtracting(true);
        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(data.file!);
          });

          const mimeType = data.file.type;
          
          if (mimeType.startsWith('image/')) {
            finalFeatureText = await extractContentFromImage(base64Data, mimeType);
          } else {
            finalFeatureText = await extractContentFromDocument(base64Data, mimeType);
          }
          
          if (!finalFeatureText || !finalFeatureText.trim()) {
            throw new Error("No text could be extracted.");
          }
          
          setExtractedText(finalFeatureText);
          
          // Combine extracted text with the manually entered feature text
          if (data.featureText.trim()) {
            finalFeatureText = `${data.featureText}\n\n--- Extracted from file ---\n${finalFeatureText}`;
          }
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

      const result = await analyzeFeature(finalFeatureText, data.title, data.context, clarificationNotes);
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
      setIsExtracting(false);
    }
  };

  const handleRunAnalysis = (data: { title: string; context: string; featureText: string; file: File | null }) => {
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
    setFeatureData({ ...featureData, file: null });
    setAppState('HOME');
  };

  const handlePasteText = () => {
    setFeatureData({ ...featureData, file: null });
    setAppState('HOME');
  };

  const handleNewAnalysis = () => {
    setFeatureData({ title: '', context: '', featureText: '', file: null });
    setAnalysisResult(null);
    setExtractedText('');
    setAppState('HOME');
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-200">
      {appState === 'HOME' && (
        <HomeView 
          onRunAnalysis={handleRunAnalysis} 
          initialData={featureData}
        />
      )}
      {appState === 'PROCESSING' && <ProcessingView isExtracting={isExtracting} hasFile={!!featureData?.file} />}
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
          isExtractionError={extractionError}
          onRetry={handleRetry} 
          onTryAnotherFile={handleTryAnotherFile}
          onPasteText={handlePasteText}
        />
      )}
    </main>
  );
}
