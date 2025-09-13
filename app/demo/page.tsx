"use client";

import { useState } from "react";
import { ConversionForm } from "@/components/conversion/conversion-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Globe, FileText } from "lucide-react";

interface ConversionResult {
  id: string;
  title: string;
  author: string;
  source: string;
  filename: string;
  fileSize: number;
  fileContent: string;
  date: string;
}

export default function DemoPage() {
  const [conversions, setConversions] = useState<ConversionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleConversionComplete = (result: unknown) => {
    const typedResult = result as {
      conversionId: string;
      metadata: { title: string; author: string; source: string; date: string };
      filename: string;
      fileSize: number;
      fileContent: string;
    };
    
    const newConversion: ConversionResult = {
      id: typedResult.conversionId,
      title: typedResult.metadata.title,
      author: typedResult.metadata.author,
      source: typedResult.metadata.source,
      filename: typedResult.filename,
      fileSize: typedResult.fileSize,
      fileContent: typedResult.fileContent,
      date: typedResult.metadata.date,
    };
    
    setConversions(prev => [newConversion, ...prev]);
  };

  const handleDownload = (conversion: ConversionResult) => {
    try {
      // Decode base64 content
      const binaryString = atob(conversion.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob and download
      const blob = new Blob([bytes], { 
        type: conversion.filename.endsWith('.epub') 
          ? 'application/epub+zip' 
          : 'text/html' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = conversion.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Link to Reader Demo</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Convert articles to Kindle-compatible EPUB format
          </p>
          <div className="flex justify-center gap-2 mb-6">
            <Badge variant="secondary" className="text-sm">
              <Globe className="w-3 h-3 mr-1" />
              URL Extraction
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <FileText className="w-3 h-3 mr-1" />
              Direct HTML
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Download className="w-3 h-3 mr-1" />
              EPUB Download
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">Extract from URL</TabsTrigger>
            <TabsTrigger value="html">Direct HTML Input</TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Extract from Substack URL
                </CardTitle>
                <CardDescription>
                  Paste a Substack article URL to automatically extract and convert the content to EPUB format.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <URLConversionForm 
                  onConversionComplete={handleConversionComplete}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="html" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Direct HTML Input
                </CardTitle>
                <CardDescription>
                  Paste HTML content directly to convert to EPUB format.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionForm 
                  testMode={true}
                  onConversionComplete={handleConversionComplete}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {conversions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Recent Conversions</h2>
            <div className="space-y-4">
              {conversions.map((conversion) => (
                <Card key={conversion.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{conversion.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {conversion.author} • {conversion.source}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{formatDate(conversion.date)}</span>
                          <span>{formatFileSize(conversion.fileSize)}</span>
                          <Badge variant={conversion.filename.endsWith('.epub') ? 'default' : 'secondary'}>
                            {conversion.filename.endsWith('.epub') ? 'EPUB' : 'HTML'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownload(conversion)}
                        className="ml-4"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// URL Conversion Form Component
function URLConversionForm({ 
  onConversionComplete, 
  isLoading, 
  setIsLoading 
}: { 
  onConversionComplete: (result: unknown) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Validate Substack URL
    if (!url.includes('substack.com')) {
      setError("Currently only supports Substack URLs");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/conversion/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract content from URL');
      }

      const result = await response.json();
      onConversionComplete(result);
      setUrl("");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to extract content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-2">
          Substack Article URL
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.substack.com/p/article-title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading || !url.trim()}
        className="w-full"
      >
        {isLoading ? "Extracting..." : "Extract & Convert to EPUB"}
      </Button>
      
      <div className="text-sm text-muted-foreground">
        <p>• Paste a Substack article URL to automatically extract the content</p>
        <p>• The article must be publicly accessible (not behind a paywall)</p>
        <p>• Content will be converted to Kindle-compatible EPUB format</p>
      </div>
    </form>
  );
} 