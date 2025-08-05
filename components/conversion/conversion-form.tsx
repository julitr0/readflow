"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ConversionFormProps {
  onConversionComplete?: (conversionId: string, downloadUrl?: string, filename?: string, fileContent?: string) => void;
  testMode?: boolean;
}

export const ConversionForm = ({ onConversionComplete, testMode = false }: ConversionFormProps) => {
  const [url, setUrl] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError("");
  };

  const handleSendToKindle = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError("");

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const response = await fetch(testMode ? "/api/conversion/test" : "/api/conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          sendToKindle: true,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert and send to Kindle");
      }

      const result = await response.json();
      
      toast.success("Article converted and sent to your Kindle!");
      
      // Reset form
      setUrl("");
      
      // Notify parent component
      if (onConversionComplete && result.conversionId) {
        onConversionComplete(result.conversionId, result.fileUrl, result.filename, result.fileContent);
      }

    } catch (error) {
      console.error("Conversion error:", error);
      setError(error instanceof Error ? error.message : "Failed to convert and send to Kindle");
      toast.error(error instanceof Error ? error.message : "Failed to convert and send to Kindle");
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isConverting && url.trim()) {
      handleSendToKindle();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <LinkIcon className="h-5 w-5" />
          Paste Article URL
        </CardTitle>
        <CardDescription>
          We&apos;ll fetch, convert, and send it directly to your Kindle device
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-3">
          <Label htmlFor="article-url" className="text-base font-medium">
            Article URL
          </Label>
          <Input
            id="article-url"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-base h-12"
            disabled={isConverting}
          />
          <p className="text-sm text-muted-foreground">
            Supports articles from Substack, Medium, newsletters, blogs, and most websites
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {isConverting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Converting and sending to Kindle...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              This usually takes 10-30 seconds depending on article length
            </p>
          </div>
        )}

        {/* Send to Kindle Button */}
        <Button
          onClick={handleSendToKindle}
          disabled={isConverting || !url.trim()}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Converting & Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Send to Kindle
            </>
          )}
        </Button>

        {!isConverting && (
          <p className="text-xs text-muted-foreground text-center">
            The converted article will be sent to your personal Kindle email address
          </p>
        )}
      </CardContent>
    </Card>
  );
};