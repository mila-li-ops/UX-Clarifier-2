"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, RefreshCcw, FileJson } from 'lucide-react';

interface ErrorViewProps {
  error: Error | string;
  rawResponse?: string;
  onRetry: () => void;
}

export function ErrorView({ error, rawResponse, onRetry }: ErrorViewProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Analysis Failed</h2>
        <p className="text-slate-500">We encountered an issue while validating your feature.</p>
      </div>

      <Card className="w-full max-w-lg border-red-200 shadow-sm bg-red-50/50">
        <CardContent className="p-6 space-y-4">
          <div className="p-4 bg-white rounded-md border border-red-100 text-sm text-red-800 font-mono break-words">
            {error instanceof Error ? error.message : String(error)}
          </div>

          {rawResponse && (
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRaw(!showRaw)}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <FileJson className="w-4 h-4 mr-2" />
                  {showRaw ? "Hide Raw Response" : "View Raw Response"}
                </span>
              </Button>
              
              {showRaw && (
                <div className="p-4 bg-slate-950 rounded-md overflow-auto max-h-64">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {rawResponse}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button onClick={onRetry} className="flex-1" size="lg">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
