"use client"

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, FileText, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { extractContentFromImage, extractContentFromDocument } from '@/lib/gemini';

interface HomeViewProps {
  onRunAnalysis: (data: { title: string; context: string; featureText: string }) => void;
}

export function HomeView({ onRunAnalysis }: HomeViewProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [featureText, setFeatureText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        
        let extractedText = '';
        if (mimeType.startsWith('image/')) {
          extractedText = await extractContentFromImage(base64Data, mimeType);
        } else {
          extractedText = await extractContentFromDocument(base64Data, mimeType);
        }
        
        setFeatureText((prev) => prev ? prev + '\n\n' + extractedText : extractedText);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("Failed to extract text from file. Please try pasting it manually.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureText.trim()) {
      alert("Please provide a feature description.");
      return;
    }
    onRunAnalysis({ title, context, featureText });
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
              <div className="flex items-center justify-between">
                <Label htmlFor="featureText">Feature Description</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf,.txt,.docx"
                    onChange={handleFileUpload}
                    suppressHydrationWarning
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    suppressHydrationWarning
                  >
                    {isExtracting ? (
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3 mr-2" />
                    )}
                    Upload File / Image
                  </Button>
                </div>
              </div>
              <Textarea 
                id="featureText" 
                placeholder="Paste your feature description here, or upload a document/image to extract text..." 
                className="min-h-[200px]"
                value={featureText}
                onChange={(e) => setFeatureText(e.target.value)}
                required
                suppressHydrationWarning
              />
              <p className="text-xs text-slate-500">
                You can edit the extracted text before running the analysis.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isExtracting || !featureText.trim()} suppressHydrationWarning>
              <Sparkles className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
