"use client"

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, FileText, Sparkles, X } from 'lucide-react';

interface HomeViewProps {
  onRunAnalysis: (data: { title: string; context: string; featureText: string; file: File | null }) => void;
  initialData?: { title: string; context: string; featureText: string; file: File | null };
}

export function HomeView({ onRunAnalysis, initialData }: HomeViewProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [context, setContext] = useState(initialData?.context || '');
  const [featureText, setFeatureText] = useState(initialData?.featureText || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(initialData?.file || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
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
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isValidType = file.type.startsWith('image/') || 
                          file.type === 'application/pdf' || 
                          file.type === 'text/plain' ||
                          file.name.endsWith('.docx');
      if (isValidType) {
        setSelectedFile(file);
      } else {
        alert("Unsupported file type. Please upload an image, PDF, TXT, or DOCX file.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureText.trim() && !selectedFile) {
      alert("Please provide a feature description or upload a file.");
      return;
    }
    onRunAnalysis({ title, context, featureText, file: selectedFile });
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-slate-900" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">UX Clarifier</h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Validate feature clarity before starting design. Detect implicit assumptions, structural risks, and likely UX failures.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} suppressHydrationWarning>
          <CardHeader>
            <CardTitle>Feature Details</CardTitle>
            <CardDescription>Provide the context and description of the feature you want to analyze.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Feature Title (Optional)</Label>
              <Input 
                id="title" 
                placeholder="e.g., User Onboarding Flow" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                suppressHydrationWarning
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Product Context (Optional)</Label>
              <Textarea 
                id="context" 
                placeholder="Platform, target users, specific constraints..." 
                className="min-h-[80px]"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                suppressHydrationWarning
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featureText">Feature Description</Label>
              
              <div 
                className={`relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer ${
                  isDragging 
                    ? 'border-slate-400 bg-slate-50 scale-[1.01]' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,.pdf,.txt,.docx"
                  onChange={handleFileUpload}
                  suppressHydrationWarning
                />
                
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className={`p-4 rounded-full transition-colors duration-200 ${isDragging ? 'bg-slate-200' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <Upload className={`w-6 h-6 transition-colors duration-200 ${isDragging ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">
                      Drag and drop your file here, or{' '}
                      <span className="text-blue-600 group-hover:text-blue-700 group-hover:underline">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports PDF, DOCX, TXT, PNG, JPG
                    </p>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-md bg-white shadow-sm mt-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedFile(null)}
                    className="flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              )}
              
              <div className="pt-4">
                <Textarea 
                  id="featureText" 
                  placeholder="Or paste your feature description here..." 
                  className="min-h-[200px]"
                  value={featureText}
                  onChange={(e) => setFeatureText(e.target.value)}
                  required={!selectedFile}
                  suppressHydrationWarning
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={!featureText.trim() && !selectedFile} suppressHydrationWarning>
              <Sparkles className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
