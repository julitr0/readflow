"use client";

import { useState } from "react";
import { ConversionForm } from "@/components/conversion/conversion-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";

interface MockConversion {
  id: string;
  title: string;
  author: string;
  source: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  readingTime: number;
  wordCount: number;
}

export default function TestConvertPage() {
  const [conversions, setConversions] = useState<MockConversion[]>([]);

  const handleConversionComplete = (conversionId: string) => {
    // Add a mock conversion to the list
    const mockConversion: MockConversion = {
      id: conversionId,
      title: "Sample Article",
      author: "John Doe",
      source: "Substack",
      status: "completed",
      createdAt: new Date().toISOString(),
      readingTime: 5,
      wordCount: 1000,
    };
    
    setConversions(prev => [mockConversion, ...prev]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-start justify-center gap-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Convert to Kindle - Test Mode
          </h1>
          <p className="text-muted-foreground">
            Test the conversion functionality with mock data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conversion Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Convert Article
                </CardTitle>
                <CardDescription>
                  Upload HTML content or paste it directly to convert to Kindle-compatible format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionForm onConversionComplete={handleConversionComplete} testMode={true} />
              </CardContent>
            </Card>
          </div>

          {/* Mock Conversions List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversions (Mock)</CardTitle>
                <CardDescription>
                  Your converted articles ready for Kindle reading
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversions yet. Try converting an article!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversions.map((conversion) => (
                      <div key={conversion.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{conversion.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {conversion.author} • {conversion.source}
                            </p>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(conversion.status)}
                              <span className="text-sm text-muted-foreground">
                                {conversion.readingTime} min read
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sample HTML for Testing */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sample HTML for Testing</CardTitle>
              <CardDescription>
                Copy this sample HTML to test the conversion functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`<!DOCTYPE html>
<html>
<head>
    <title>Sample Newsletter Article</title>
    <meta name="author" content="Jane Smith">
    <meta name="source" content="Tech Newsletter">
</head>
<body>
    <h1>The Future of AI in 2024</h1>
    <p>Artificial Intelligence continues to evolve at an unprecedented pace...</p>
    <p>Recent developments in machine learning have shown remarkable progress...</p>
    <h2>Key Trends</h2>
    <ul>
        <li>Large Language Models</li>
        <li>Computer Vision</li>
        <li>Robotics</li>
    </ul>
    <p>As we look ahead, the integration of AI into everyday applications...</p>
</body>
</html>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
} 