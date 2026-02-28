"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download, RefreshCw, PlusCircle, AlertTriangle, CheckCircle, Info, FileText } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ResultsViewProps {
  result: any;
  onRefine: (clarificationNotes: string) => void;
  onNewAnalysis: () => void;
  title: string;
}

export function ResultsView({ result, onRefine, onNewAnalysis, title }: ResultsViewProps) {
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

  React.useEffect(() => {
    setCurrentDate(new Date().toLocaleString());
  }, []);

  const handleExportPDF = () => {
    window.print();
  };

  const handleRefine = () => {
    if (!clarificationNotes.trim()) {
      alert("Please enter clarification notes before refining.");
      return;
    }
    setIsRefining(true);
    onRefine(clarificationNotes);
  };

  const renderList = (items: string[], emptyMsg = "None identified") => {
    if (!items || items.length === 0) return <p className="text-sm text-slate-500 italic">{emptyMsg}</p>;
    return (
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-slate-700">{item}</li>
        ))}
      </ul>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analysis Results</h1>
          <p className="text-slate-500 mt-1">{title || "Untitled Feature"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={onNewAnalysis}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      <div className="print-container space-y-8">
        {/* Print Header */}
        <div className="hidden print:block mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Clarity Report</h1>
          <p className="text-xl text-slate-600">{title || "Untitled Feature"}</p>
          <p className="text-sm text-slate-400 mt-4">Generated on {currentDate}</p>
        </div>

        {/* Executive Summary */}
        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{result.executiveSummary}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Implicit Assumptions */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Implicit Assumptions
              </CardTitle>
              <CardDescription>Unstated beliefs that must be true for this to work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Behavioral</h4>
                {renderList(result.implicitAssumptions?.behavioral)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Technical</h4>
                {renderList(result.implicitAssumptions?.technical)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Business</h4>
                {renderList(result.implicitAssumptions?.business)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">UX</h4>
                {renderList(result.implicitAssumptions?.ux)}
              </div>
            </CardContent>
          </Card>

          {/* System Risk Scenarios */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                System Risk Scenarios
              </CardTitle>
              <CardDescription>Edge cases and structural risks identified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Failure States</h4>
                {renderList(result.systemRiskScenarios?.failureStates)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Permission Conflicts</h4>
                {renderList(result.systemRiskScenarios?.permissionConflicts)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Empty Data Scenarios</h4>
                {renderList(result.systemRiskScenarios?.emptyDataScenarios)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Concurrency Issues</h4>
                {renderList(result.systemRiskScenarios?.concurrencyIssues)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">User Misuse Patterns</h4>
                {renderList(result.systemRiskScenarios?.userMisusePatterns)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predicted UX Problems */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Predicted UX Problems
            </CardTitle>
            <CardDescription>Potential friction points and usability issues.</CardDescription>
          </CardHeader>
          <CardContent>
            {result.predictedUxProblems?.length > 0 ? (
              <div className="space-y-4">
                {result.predictedUxProblems.map((prob: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(prob.severity)}`}>
                        {prob.severity} Severity
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{prob.problem}</h4>
                      <p className="text-sm text-slate-600">{prob.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No major UX problems predicted.</p>
            )}
          </CardContent>
        </Card>

        {/* Next Actions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Next Actions
            </CardTitle>
            <CardDescription>Recommended steps to resolve clarity issues before design.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderList(result.nextActions)}
          </CardContent>
        </Card>
      </div>

      {/* Refine Analysis Section (Hidden in Print) */}
      <div className="mt-12 pt-8 border-t border-slate-200 print:hidden">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Refine Analysis</h3>
        <p className="text-sm text-slate-500 mb-4">
          Add clarification notes to address the assumptions or risks above, and run the analysis again to see if the clarity improves.
        </p>
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="clarificationNotes">Clarification Notes</Label>
            <Textarea 
              id="clarificationNotes" 
              placeholder="e.g., The user will always be authenticated before reaching this flow. The empty state will show a generic illustration." 
              className="min-h-[100px]"
              value={clarificationNotes}
              onChange={(e) => setClarificationNotes(e.target.value)}
            />
          </div>
          <Button onClick={handleRefine} disabled={isRefining || !clarificationNotes.trim()}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefining ? 'animate-spin' : ''}`} />
            {isRefining ? 'Refining...' : 'Run Refined Analysis'}
          </Button>
        </div>
      </div>
    </div>
  );
}
