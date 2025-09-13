'use client';

import { useState } from 'react';
import { IconMail, IconCopy, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonalEmailCardProps {
  personalEmail?: string;
  userId: string;
}

export function PersonalEmailCard({ personalEmail, userId }: PersonalEmailCardProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate email if not set (in real app, this should be done server-side)
  const email = personalEmail || `${userId.slice(0, 8)}@linktoreader.com`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconMail className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Your Link to Reader Email</CardTitle>
        </div>
        <CardDescription>
          Share articles to this email address to convert them to EPUB for your Kindle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-lg bg-white dark:bg-gray-800 px-3 py-2 rounded-md border truncate">
              {email}
            </div>
          </div>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {copied ? (
              <>
                <IconCheck className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <IconCopy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <strong>How to use:</strong> When reading newsletters or articles, click &quot;Share via Email&quot; 
          and send to your Link to Reader address. We&apos;ll convert it to EPUB and deliver to your Kindle automatically.
        </div>
      </CardContent>
    </Card>
  );
}