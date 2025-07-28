"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Filter, Download, Eye, Calendar, Clock, User, Globe, CheckCircle, XCircle, Clock as ClockIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Conversion {
  id: string;
  title: string;
  author: string;
  source: string;
  sourceUrl?: string;
  date: string;
  wordCount: number;
  readingTime: number;
  status: "pending" | "completed" | "failed";
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface ConversionsListProps {
  onRefresh?: () => void;
}

export const ConversionsList = ({ onRefresh }: ConversionsListProps) => {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null);

  const fetchConversions = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });

      if (search) {
        params.append("search", search);
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/conversion?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversions");
      }

      const data = await response.json();
      
      if (append) {
        setConversions(prev => [...prev, ...data.conversions]);
      } else {
        setConversions(data.conversions);
      }
      
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(data.pagination.page);
    } catch (error) {
      console.error("Error fetching conversions:", error);
      toast.error("Failed to load conversions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions(1, false);
  }, [search, statusFilter]);

  const handleRefresh = () => {
    setPage(1);
    fetchConversions(1, false);
    onRefresh?.();
  };

  const handleLoadMore = () => {
    fetchConversions(page + 1, true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "pending":
        return <Badge variant="secondary"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = async (conversion: Conversion) => {
    if (!conversion.fileUrl) {
      toast.error("No file available for download");
      return;
    }

    try {
      // In real implementation, this would trigger the actual file download
      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleViewDetails = (conversion: Conversion) => {
    setSelectedConversion(conversion);
  };

  if (loading && conversions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Your Conversions</h2>
          <p className="text-muted-foreground">
            {conversions.length} article{conversions.length !== 1 ? "s" : ""} converted
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversions Table */}
      {conversions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversions yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by converting your first article to Kindle format
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
            <CardDescription>
              Your converted articles ready for Kindle reading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{conversion.title}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {conversion.readingTime} min read
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {conversion.author}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {conversion.source}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(conversion.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(conversion.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatFileSize(conversion.fileSize)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(conversion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {conversion.status === "completed" && conversion.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(conversion)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button onClick={handleLoadMore} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conversion Details Dialog */}
      <Dialog open={!!selectedConversion} onOpenChange={() => setSelectedConversion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversion Details</DialogTitle>
            <DialogDescription>
              Detailed information about this conversion
            </DialogDescription>
          </DialogHeader>
          
          {selectedConversion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{selectedConversion.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Author</Label>
                  <p className="text-sm text-muted-foreground">{selectedConversion.author}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <p className="text-sm text-muted-foreground">{selectedConversion.source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedConversion.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Word Count</Label>
                  <p className="text-sm text-muted-foreground">{selectedConversion.wordCount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reading Time</Label>
                  <p className="text-sm text-muted-foreground">{selectedConversion.readingTime} minutes</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">File Size</Label>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedConversion.fileSize)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedConversion.createdAt)}</p>
                </div>
              </div>
              
              {selectedConversion.sourceUrl && (
                <div>
                  <Label className="text-sm font-medium">Source URL</Label>
                  <a 
                    href={selectedConversion.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedConversion.sourceUrl}
                  </a>
                </div>
              )}
              
              {selectedConversion.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {selectedConversion.error}
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedConversion.status === "completed" && selectedConversion.fileUrl && (
                <div className="flex gap-2">
                  <Button onClick={() => handleDownload(selectedConversion)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 