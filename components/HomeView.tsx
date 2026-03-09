"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, FileText, Sparkles, X, ChevronDown, Check, LogIn, LogOut, Clock, ChevronRight, Trash2, ExternalLink } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { getAnalyses, deleteAnalysis, SavedAnalysis } from '@/lib/firestore';

export interface AnalysisData {
  title: string;
  featureComplexity: string;
  productType: string;
  platform: string;
  targetUsers: string;
  designStage: string;
  focusArea: string[];
  featureText: string;
  files: File[];
}

interface HomeViewProps {
  onRunAnalysis: (data: AnalysisData) => void;
  initialData?: AnalysisData;
  onOpenFromHistory?: (result: any, title: string) => void;
}

function CustomSelect({ id, value, onChange, placeholder, options }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`h-10 w-full flex items-center justify-between rounded-xl border bg-white px-3 pr-8 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${open ? 'border-slate-950 ring-2 ring-slate-950 ring-offset-2' : 'border-slate-200'} ${value ? 'text-slate-900' : 'text-slate-400'}`}
      >
        {value || placeholder}
      </button>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-md py-1">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 ${value === option ? 'bg-slate-50 font-medium' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ id, value, onChange, placeholder, options }: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (option: string) => {
    onChange(value.includes(option) ? value.filter(v => v !== option) : [...value, option]);
  };

  const label = value.length === 0 ? placeholder : value.join(', ');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`h-10 w-full flex items-center justify-between rounded-xl border bg-white px-3 pr-8 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${open ? 'border-slate-950 ring-2 ring-slate-950 ring-offset-2' : 'border-slate-200'} ${value.length > 0 ? 'text-slate-900' : 'text-slate-400'}`}
      >
        <span className="truncate">{label}</span>
      </button>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-md py-1">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              <span className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${value.includes(option) ? 'bg-slate-900 border-slate-900' : 'border-slate-300'}`}>
                {value.includes(option) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </span>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HomeView({ onRunAnalysis, initialData, onOpenFromHistory }: HomeViewProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [featureComplexity, setFeatureComplexity] = useState(initialData?.featureComplexity || '');
  const [productType, setProductType] = useState(initialData?.productType || '');
  const [platform, setPlatform] = useState(initialData?.platform || '');
  const [targetUsers, setTargetUsers] = useState(initialData?.targetUsers || '');
  const [designStage, setDesignStage] = useState(initialData?.designStage || '');
  const [focusArea, setFocusArea] = useState<string[]>(initialData?.focusArea || []);
  const [featureText, setFeatureText] = useState(initialData?.featureText || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialData?.files || []);
  const [isDragging, setIsDragging] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const toAdd = newFiles.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...toAdd];
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const valid = files.filter(f =>
      f.type.startsWith('image/') ||
      f.type === 'application/pdf' ||
      f.type === 'text/plain' ||
      f.name.endsWith('.docx')
    );
    const invalid = files.length - valid.length;
    if (invalid > 0) alert(`${invalid} file(s) skipped. Please upload images, PDFs, TXT, or DOCX files.`);
    if (valid.length) addFiles(valid);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureText.trim() && selectedFiles.length === 0) {
      alert("Please provide a feature description or upload a file.");
      return;
    }
    onRunAnalysis({ title, featureComplexity, productType, platform, targetUsers, designStage, focusArea, featureText, files: selectedFiles });
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="inline-flex items-center justify-center p-2 bg-slate-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">UX Clarifier</h1>
        </div>
        <p className="text-base text-slate-600 max-w-xl mx-auto">
          Validate feature clarity before starting design. Detect implicit assumptions, structural risks, and likely UX failures.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} suppressHydrationWarning>
          <CardContent className="space-y-3 pt-4">

            {/* Step 1 */}
            <div>
              <span className="block text-base font-semibold text-slate-900 mb-2">Describe the feature you want to review</span>

              <div
                className={`relative rounded-xl border transition-all duration-200 bg-white ${
                  isDragging ? 'border-slate-400 bg-slate-50' : 'border-slate-200'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf,.txt,.docx"
                  multiple
                  onChange={handleFileUpload}
                  suppressHydrationWarning
                />

                {/* Upload row */}
                <div className="flex flex-col gap-2 px-4 pt-3 pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors self-start"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload PRD / screenshot / flow</span>
                  </button>

                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
                          <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-600 truncate max-w-[200px]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i)} className="flex-shrink-0 ml-0.5">
                            <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textarea */}
                <Textarea
                  id="featureText"
                  placeholder={`e.g., The goal of User Onboarding feature is to help new users connect to their first integration. The process looks like this: "Sign up → connect to Slack → invite a team."`}
                  className="min-h-[140px] border-0 shadow-none rounded-none rounded-b-xl focus-visible:ring-0 focus-visible:ring-offset-0 resize-none placeholder:text-slate-400"
                  value={featureText}
                  onChange={(e) => setFeatureText(e.target.value)}
                  required={selectedFiles.length === 0}
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <button
                type="button"
                onClick={() => setOptionalOpen(!optionalOpen)}
                className="flex items-center gap-2 text-base font-semibold text-slate-900"
              >
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${optionalOpen ? '' : '-rotate-90'}`} />
                Context for better analysis
              </button>

              {optionalOpen && (
                <div className="mt-4 space-y-3">

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="title">Feature title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., User Onboarding Flow"
                      className="rounded-xl placeholder:text-slate-400"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      suppressHydrationWarning
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="featureComplexity">Feature complexity</Label>
                    <CustomSelect
                      id="featureComplexity"
                      value={featureComplexity}
                      onChange={setFeatureComplexity}
                      placeholder="Select complexity"
                      options={['Simple interaction', 'Multi-step flow', 'System configuration', 'Data-heavy workflow']}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="targetUsers">Target users</Label>
                    <Input
                      id="targetUsers"
                      placeholder="e.g., Product managers in mid-size SaaS companies"
                      className="rounded-xl placeholder:text-slate-400"
                      value={targetUsers}
                      onChange={(e) => setTargetUsers(e.target.value)}
                      suppressHydrationWarning
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <Label htmlFor="productType">Product type</Label>
                      <CustomSelect
                        id="productType"
                        value={productType}
                        onChange={setProductType}
                        placeholder="Select product type"
                        options={['B2B SaaS', 'B2C app', 'Marketplace', 'Mobile app', 'Internal tool', 'Developer tool']}
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <Label htmlFor="platform">Platform</Label>
                      <CustomSelect
                        id="platform"
                        value={platform}
                        onChange={setPlatform}
                        placeholder="Select platform"
                        options={['Web', 'Mobile', 'Web + Mobile', 'Desktop']}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <Label htmlFor="designStage">Design stage</Label>
                      <CustomSelect
                        id="designStage"
                        value={designStage}
                        onChange={setDesignStage}
                        placeholder="Select stage"
                        options={['Idea / early concept', 'User flow', 'Wireframes', 'High-fidelity design', 'Pre-handoff to development']}
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <Label htmlFor="focusArea">Focus analysis on</Label>
                      <MultiSelect
                        id="focusArea"
                        value={focusArea}
                        onChange={setFocusArea}
                        placeholder="Select focus areas"
                        options={['Edge cases', 'Missing states', 'User confusion risks', 'Accessibility issues', 'UX consistency', 'Error handling']}
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full rounded-xl" size="lg" disabled={!featureText.trim() && selectedFiles.length === 0} suppressHydrationWarning>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze UX Risks
            </Button>
          </CardFooter>
        </form>
      </Card>
      <AuthFooter onOpenFromHistory={onOpenFromHistory} />
    </div>
  );
}

function AuthFooter({ onOpenFromHistory }: { onOpenFromHistory?: (result: any, title: string) => void }) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    getAnalyses(user.uid).then(setAnalyses).catch(console.error);
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <div className="mt-4">
      {user ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="relative group/recent">
              <button
                onClick={analyses.length > 0 ? () => setExpanded((v) => !v) : undefined}
                disabled={analyses.length === 0}
                className={`inline-flex items-center gap-1 text-sm transition-colors ${analyses.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                style={{ color: 'oklch(0.208 0.042 265.755)' }}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                Recent analyses
              </button>
              {analyses.length === 0 && (
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 group-hover/recent:opacity-100 transition-opacity">
                  No recent analyses
                </span>
              )}
            </div>
            <button onClick={handleSignOut} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
          {expanded && analyses.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-3">
              {analyses.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title || 'Untitled Feature'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-400">{item.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <div className="relative group/view">
                      <button
                        onClick={() => onOpenFromHistory?.(item.result, item.title)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 group-hover/view:opacity-100 transition-opacity">
                        View
                      </span>
                    </div>
                    <div className="relative group/del">
                      <button
                        onClick={async () => {
                          if (!user) return;
                          await deleteAnalysis(user.uid, item.id);
                          setAnalyses((prev) => prev.filter((a) => a.id !== item.id));
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 group-hover/del:opacity-100 transition-opacity">
                        Delete
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-sm text-slate-400">Want to save your analysis history?</span>
          <button onClick={handleSignIn} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            <LogIn className="w-3.5 h-3.5" />
            Log in with Google
          </button>
        </div>
      )}
    </div>
  );
}
