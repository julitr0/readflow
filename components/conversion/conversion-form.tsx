"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, Clock, User, Globe } from "lucide-react";
import { toast } from "sonner";

interface ConversionFormProps {
  onConversionComplete?: (conversionId: string, downloadUrl?: string, filename?: string, fileContent?: string) => void;
  testMode?: boolean;
}

interface ConversionMetadata {
  title: string;
  author: string;
  source: string;
  sourceUrl?: string;
}

export const ConversionForm = ({ onConversionComplete, testMode = false }: ConversionFormProps) => {
  const [htmlContent, setHtmlContent] = useState("");
  const [metadata, setMetadata] = useState<ConversionMetadata>({
    title: "",
    author: "",
    source: "",
    sourceUrl: "",
  });
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleContentChange = (value: string) => {
    setHtmlContent(value);
    setErrors([]);
    
    // Auto-extract metadata if content is substantial
    if (value.length > 100) {
      extractMetadataFromContent(value);
    }
  };

  const extractMetadataFromContent = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    
    const title = doc.querySelector("title")?.textContent || 
                  doc.querySelector("h1")?.textContent || 
                  "";
    
    const author = doc.querySelector('meta[name="author"]')?.getAttribute("content") ||
                   doc.querySelector(".author")?.textContent ||
                   "";
    
    const source = doc.querySelector('meta[name="source"]')?.getAttribute("content") ||
                   "";
    
    if (title || author || source) {
      setMetadata(prev => ({
        ...prev,
        title: title || prev.title,
        author: author || prev.author,
        source: source || prev.source,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!htmlContent.trim()) {
      newErrors.push("HTML content is required");
    }
    
    if (!metadata.title.trim()) {
      newErrors.push("Article title is required");
    }
    
    if (!metadata.author.trim()) {
      newErrors.push("Author is required");
    }
    
    if (!metadata.source.trim()) {
      newErrors.push("Source is required");
    }
    
    if (htmlContent.length > 1000000) {
      newErrors.push("Content is too large (max 1MB)");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleConvert = async () => {
    if (!validateForm()) {
      return;
    }

    setIsConverting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(testMode ? "/api/conversion/test" : "/api/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          htmlContent,
          sourceUrl: metadata.sourceUrl,
          customMetadata: metadata,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }

      const result = await response.json();
      
      toast.success("Article converted successfully!");
      
      // Reset form
      setHtmlContent("");
      setMetadata({
        title: "",
        author: "",
        source: "",
        sourceUrl: "",
      });
      
      // Notify parent component
      if (onConversionComplete && result.conversionId) {
        onConversionComplete(result.conversionId, result.fileUrl, result.filename, result.fileContent);
      }

    } catch (error) {
      console.error("Conversion error:", error);
      toast.error(error instanceof Error ? error.message : "Conversion failed");
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1000000) {
      toast.error("File is too large (max 1MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlContent(content);
      extractMetadataFromContent(content);
    };
    reader.readAsText(file);
  };

  const wordCount = htmlContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Convert to Kindle Format
        </CardTitle>
        <CardDescription>
          Upload HTML content or paste it directly to convert to EPUB format for Kindle
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload HTML File</Label>
          <div className="flex items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>

        {/* Content Input */}
        <div className="space-y-2">
          <Label htmlFor="html-content">HTML Content</Label>
          <Textarea
            id="html-content"
            placeholder="Paste your HTML content here..."
            value={htmlContent}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{wordCount} words</span>
            <span>{readingTime} min read</span>
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter article title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={metadata.author}
              onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Enter author name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={metadata.source}
              onChange={(e) => setMetadata(prev => ({ ...prev, source: e.target.value }))}
              placeholder="e.g., Substack, Medium, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={metadata.sourceUrl}
              onChange={(e) => setMetadata(prev => ({ ...prev, sourceUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Preview */}
        {metadata.title && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{metadata.source}</Badge>
                <Badge variant="outline">{readingTime} min read</Badge>
              </div>
              <h3 className="font-semibold text-lg">{metadata.title}</h3>
              <p className="text-sm text-muted-foreground">by {metadata.author}</p>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {isConverting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Converting...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Convert Button */}
        <Button
          onClick={handleConvert}
          disabled={isConverting || !htmlContent.trim()}
          className="w-full"
          size="lg"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Convert to EPUB Format
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}; 