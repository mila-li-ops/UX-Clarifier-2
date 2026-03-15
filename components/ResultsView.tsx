"use client"

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Download, RefreshCw, PlusCircle, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, ShieldAlert, Target, Activity, Zap, Sparkles } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ResultsViewProps {
  result: any;
  onRefine: (clarificationNotes: string) => void;
  onNewAnalysis: () => void;
  title: string;
}

// Normalize items from the API — handles both the new rich object format and any legacy string format
const normalizeItems = (items: any[] = []) => {
  return items.map((item) => {
    if (typeof item === 'string') {
      return { title: item.split('.')[0] || item, description: item, severity: 'Medium', likelihood: 'Medium' };
    }
    return item;
  });
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[severity] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${colors}`}>
      {severity}
    </span>
  );
};

const ExpandableRow = ({ item, categoryColor, isLast }: { item: any, categoryColor: string, isLast: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div
        className="px-4 py-3 cursor-pointer flex items-start gap-3 hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <SeverityBadge severity={item.severity} />
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
          {!isExpanded && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 bg-slate-50 text-sm space-y-3">
          {item.whyImplicit && (
            <div>
              <span className="font-medium text-slate-900 block mb-0.5">Context / Why it matters:</span>
              <span className="text-slate-600">{item.whyImplicit}</span>
            </div>
          )}
          {item.consequences && (
            <div>
              <span className="font-medium text-slate-900 block mb-0.5">Potential Consequences:</span>
              <span className="text-slate-600">{item.consequences}</span>
            </div>
          )}
          {item.clarificationQuestion && (
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800">
              <span className="font-semibold block mb-0.5">Clarification Needed:</span>
              {item.clarificationQuestion}
            </div>
          )}
          <div className="flex gap-4 pt-2 mt-2 border-t border-slate-200/60 text-xs text-slate-500">
            {item.likelihood && <span>Likelihood: <strong className="text-slate-700">{item.likelihood}</strong></span>}
            {item.detectionStage && <span>Detection: <strong className="text-slate-700">{item.detectionStage}</strong></span>}
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, items, categoryColor, id }: any) => {
  if (!items || items.length === 0) return null;

  const sortedItems = [...items].sort((a, b) => {
    const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return (
    <div id={id} className="scroll-mt-24 mb-4">
      <div className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm border-l-4 ${categoryColor.replace('border-', 'border-l-')}`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          {(() => {
            const hasHigh = items.some((i: any) => i.severity === 'High');
            const hasMedium = items.some((i: any) => i.severity === 'Medium');
            const dotColor = hasHigh ? 'bg-red-700' : hasMedium ? 'bg-amber-500' : 'bg-emerald-700';
            return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />;
          })()}
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs font-medium">
            {items.length}
          </span>
        </div>
        {sortedItems.map((item: any, idx: number) => (
          <ExpandableRow key={idx} item={item} categoryColor={categoryColor} isLast={idx === sortedItems.length - 1} />
        ))}
      </div>
    </div>
  );
};

export function ResultsView({ result, onRefine, onNewAnalysis, title }: ResultsViewProps) {
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleString());
  }, []);

  const handleExportPDF = () => {
    window.print();
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClarificationNotes(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleRefine = () => {
    if (!clarificationNotes.trim()) {
      alert("Please enter clarification notes before refining.");
      return;
    }
    setIsRefining(true);
    onRefine(clarificationNotes);
  };

  // Process data to fit the new UI structure
  const uxProblems = normalizeItems(
    result.predictedUxProblems?.map((p: any) =>
      typeof p === 'string' ? p : { ...p, title: p.title ?? p.problem }
    )
  );

  const behavioralAssumptions = normalizeItems(result.implicitAssumptions?.behavioral);
  const technicalAssumptions = normalizeItems(result.implicitAssumptions?.technical);
  const uxAssumptions = normalizeItems(result.implicitAssumptions?.ux);

  const failureStates = normalizeItems(result.systemRiskScenarios?.failureStates);
  const permissionConflicts = normalizeItems(result.systemRiskScenarios?.permissionConflicts);
  const emptyDataScenarios = normalizeItems(result.systemRiskScenarios?.emptyDataScenarios);
  const concurrencyIssues = normalizeItems(result.systemRiskScenarios?.concurrencyIssues);
  const userMisusePatterns = normalizeItems(result.systemRiskScenarios?.userMisusePatterns);

  const allRisks = [
    ...uxProblems,
    ...behavioralAssumptions, ...technicalAssumptions, ...uxAssumptions,
    ...failureStates, ...permissionConflicts, ...emptyDataScenarios, ...concurrencyIssues, ...userMisusePatterns
  ];

  const topCriticalRisks = allRisks
    .sort((a, b) => {
      const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    })
    .slice(0, 2);

  // Mock metrics for the sticky panel
  const ambiguityScore = Math.max(20, 100 - (allRisks.length * 2));
  const reworkProb = Math.min(95, allRisks.filter(r => r.severity === 'High').length * 15);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 pb-24">
      {/* Sticky Anchor Navigation & Summary Panel */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main row: logo + desktop nav + scores */}
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <button
                onClick={onNewAnalysis}
                aria-label="Go to Home"
                className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded flex-shrink-0"
              >
                <Sparkles className="w-4 h-4 text-slate-700 group-hover:text-slate-900 transition-colors" />
                <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors text-sm tracking-tight whitespace-nowrap">UX Clarifier</span>
              </button>
              <div className="hidden md:flex items-center space-x-5 border-l border-slate-200 pl-4 overflow-x-auto">
                <button onClick={() => scrollTo('summary')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Summary</button>
                <button onClick={() => scrollTo('assumptions')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Assumptions</button>
                <button onClick={() => scrollTo('risks')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Risk Scenarios</button>
                <button onClick={() => scrollTo('ux')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">UX Problems</button>
                <button onClick={() => scrollTo('actions')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Next Actions</button>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ambiguity Score</span>
                <span className={`text-sm font-bold ${ambiguityScore < 50 ? 'text-red-600' : ambiguityScore < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {ambiguityScore}/100
                </span>
              </div>
            </div>
          </div>
          {/* Mobile nav row */}
          <div className="md:hidden flex items-center gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            <button onClick={() => scrollTo('summary')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Summary</button>
            <button onClick={() => scrollTo('assumptions')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Assumptions</button>
            <button onClick={() => scrollTo('risks')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Risk Scenarios</button>
            <button onClick={() => scrollTo('ux')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">UX Problems</button>
            <button onClick={() => scrollTo('actions')} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Next Actions</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10 print:hidden">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{title || "Untitled Feature"}</h1>
            <p className="text-sm text-slate-500">Clarity Analysis • Generated {currentDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onNewAnalysis} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
            <Button onClick={handleExportPDF} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="print-container">
          {/* Result Status Card + Top Critical Risks side by side */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Analysis Result */}
            <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden border-t-2 ${
              result.clarityLevel === 'Low' ? 'border-t-red-500' :
              result.clarityLevel === 'High' ? 'border-t-emerald-500' : 'border-t-amber-500'
            }`}>
              <div className="px-6 pt-6 pb-5">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3">Analysis Result</p>
                <h2 className={`text-xl font-bold tracking-tight mb-5 ${
                  result.clarityLevel === 'Low' ? 'text-red-700' :
                  result.clarityLevel === 'High' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {result.clarityLevel || (ambiguityScore < 50 ? 'Low' : ambiguityScore < 80 ? 'Moderate' : 'High')} clarity risk
                </h2>
                <div className="flex gap-8 mb-5">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1">Ambiguity Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">{ambiguityScore}</span>
                      <span className="text-sm text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1">Rework Probability</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-2xl font-bold ${result.clarityLevel === 'Low' ? 'text-red-700' : result.clarityLevel === 'High' ? 'text-emerald-700' : 'text-amber-700'}`}>{reworkProb}</span>
                      <span className="text-sm text-slate-400">%</span>
                    </div>
                  </div>
                </div>
                {result.mainIssues?.[0] && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">Primary Concern</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{result.mainIssues[0]}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Critical Risks */}
            {topCriticalRisks.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden border-t-2 border-t-red-500">
                <div className="px-6 pt-6 pb-5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3">Top Critical Risks</p>
                  <h2 className="text-xl font-bold tracking-tight text-red-700 mb-5">High severity found</h2>
                  <div className="space-y-3">
                    {topCriticalRisks.map((risk, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
                        <SeverityBadge severity="High" />
                        <p className="text-sm text-slate-800 font-medium leading-snug">{risk.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Implicit Assumptions */}
          <div id="assumptions" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Implicit Assumptions</h2>
            <Section title="Behavioral Assumptions" items={behavioralAssumptions} categoryColor="border-blue-500" />
            <Section title="Technical Assumptions" items={technicalAssumptions} categoryColor="border-blue-500" />
            <Section title="UX Assumptions" items={uxAssumptions} categoryColor="border-blue-500" />
          </div>

          {/* System Risk Scenarios */}
          <div id="risks" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">System Risk Scenarios</h2>
            <Section title="Failure States" items={failureStates} categoryColor="border-amber-500" />
            <Section title="Permission Conflicts" items={permissionConflicts} categoryColor="border-amber-500" />
            <Section title="Empty Data Scenarios" items={emptyDataScenarios} categoryColor="border-amber-500" />
            <Section title="Concurrency Issues" items={concurrencyIssues} categoryColor="border-amber-500" />
            <Section title="User Misuse Patterns" items={userMisusePatterns} categoryColor="border-amber-500" />
          </div>

          {/* Predicted UX Problems */}
          <div id="ux" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Predicted UX Problems</h2>
            <Section title="Usability Friction" items={uxProblems} categoryColor="border-pink-500" />
          </div>

          {/* Next Actions */}
          <div id="actions" className="scroll-mt-24 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">Next Actions</h2>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <ul className="space-y-4">
                  {result.nextActions?.map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Refine Analysis Section */}
        <div className="mt-16 pt-8 border border-slate-200 print:hidden bg-slate-100 -mx-4 sm:mx-0 p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">Refine Analysis</h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Add clarification notes to address the assumptions or risks above, and run the analysis again to see if the clarity improves.
          </p>
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="clarificationNotes" className="sr-only">Clarification Notes</Label>
              <Textarea 
                id="clarificationNotes" 
                placeholder="e.g., The user will always be authenticated before reaching this flow. The empty state will show a generic illustration." 
                className="min-h-[120px] resize-none overflow-hidden bg-white border-slate-300 focus:border-slate-400 focus:ring-slate-400"
                value={clarificationNotes}
                onChange={handleNotesChange}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleRefine} disabled={isRefining || !clarificationNotes.trim()} className="bg-slate-900 hover:bg-slate-800">
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefining ? 'animate-spin' : ''}`} />
                {isRefining ? 'Refining...' : 'Run Refined Analysis'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
