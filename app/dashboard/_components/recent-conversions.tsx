'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconFileText, IconCheck, IconX, IconClock, IconDownload, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

interface Conversion {
  id: string;
  title: string;
  author: string;
  source: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  deliveredAt: Date | null;
  fileUrl: string | null;
  wordCount: number;
  readingTime: number;
}

interface RecentConversionsProps {
  conversions: Conversion[];
}

export function RecentConversions({ conversions }: RecentConversionsProps) {
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const getStatusBadge = (status: string, deliveredAt: Date | null) => {
    if (status === 'completed' && deliveredAt) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <IconCheck className="w-3 h-3" />
          Delivered
        </Badge>
      );
    }
    if (status === 'completed') {
      return (
        <Badge variant="secondary">
          <IconCheck className="w-3 h-3" />
          Converted
        </Badge>
      );
    }
    if (status === 'failed') {
      return (
        <Badge variant="destructive">
          <IconX className="w-3 h-3" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <IconClock className="w-3 h-3" />
        Processing
      </Badge>
    );
  };

  const handleRetry = async (conversionId: string) => {
    setRetryingId(conversionId);
    try {
      const response = await fetch(`/api/conversions/${conversionId}/retry`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh the page or update the state
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = `/api/conversions/download?file=${encodeURIComponent(fileUrl)}`;
    link.download = `${title}.epub`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (conversions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="w-5 h-5" />
            Recent Conversions
          </CardTitle>
          <CardDescription>
            Your converted articles will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <IconFileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No conversions yet. Share your first article to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="w-5 h-5" />
              Recent Conversions
            </CardTitle>
            <CardDescription>
              Your latest article conversions and their status
            </CardDescription>
          </div>
          <Link href="/dashboard/conversions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead className="hidden sm:table-cell">Author</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.map((conversion) => (
                <TableRow key={conversion.id}>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <div className="font-medium truncate">{conversion.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {conversion.wordCount} words · {conversion.readingTime} min read
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="truncate max-w-[120px]">{conversion.author}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="truncate max-w-[120px]">{conversion.source}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(conversion.status, conversion.deliveredAt)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDistanceToNow(conversion.createdAt, { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {conversion.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetry(conversion.id)}
                          disabled={retryingId === conversion.id}
                        >
                          <IconRefresh className={`w-4 h-4 ${retryingId === conversion.id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      {conversion.status === 'completed' && conversion.fileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(conversion.fileUrl!, conversion.title)}
                        >
                          <IconDownload className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}