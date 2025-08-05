'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconDeviceTablet, IconMail, IconCheck, IconCopy } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface UserSetting {
  id: string;
  userId: string;
  kindleEmail: string | null;
  personalEmail: string;
  conversionPreferences: string | null;
  notificationPreferences: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface KindleSettingsFormProps {
  userId: string;
  currentSettings?: UserSetting;
}

export function KindleSettingsForm({ userId, currentSettings }: KindleSettingsFormProps) {
  const router = useRouter();
  const [kindleEmail, setKindleEmail] = useState(currentSettings?.kindleEmail || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate personal email if not set
  const personalEmail = currentSettings?.personalEmail || `${userId.slice(0, 8)}@readflow.com`;

  const handleSave = async () => {
    if (!kindleEmail.trim()) {
      toast.error('Please enter your Kindle email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(kindleEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kindleEmail: kindleEmail.trim(),
          personalEmail,
        }),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyPersonalEmail = async () => {
    try {
      await navigator.clipboard.writeText(personalEmail);
      setCopied(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Email Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconMail className="w-5 h-5 text-blue-600" />
            <CardTitle>Your ReadFlow Email</CardTitle>
          </div>
          <CardDescription>
            Share articles to this email address to convert them to EPUB for your Kindle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm sm:text-base bg-white dark:bg-gray-800 px-3 py-2 rounded-md border truncate">
                {personalEmail}
              </div>
            </div>
            <Button
              onClick={copyPersonalEmail}
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
        </CardContent>
      </Card>

      {/* Kindle Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconDeviceTablet className="w-5 h-5" />
            <CardTitle>Kindle Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure your Kindle email address to receive converted articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kindle-email">Kindle Email Address</Label>
            <Input
              id="kindle-email"
              type="email"
              placeholder="your-kindle@kindle.com"
              value={kindleEmail}
              onChange={(e) => setKindleEmail(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Find your Kindle email address in your Amazon account under &quot;Manage Your Content and Devices&quot;
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-lg">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
              Important Setup Steps:
            </h4>
            <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
              <li>Go to Amazon&apos;s &quot;Manage Your Content and Devices&quot;</li>
              <li>Find your Kindle email address (usually ends with @kindle.com)</li>
              <li>Add <strong>readflow@mg.readflow.com</strong> to your approved email list</li>
              <li>Enter your Kindle email address above and save</li>
            </ol>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !kindleEmail.trim()}
            className="w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* How It Works Card */}
      <Card>
        <CardHeader>
          <CardTitle>How ReadFlow Works</CardTitle>
          <CardDescription>
            Simple steps to get articles on your Kindle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Share via Email</h4>
                <p className="text-sm text-muted-foreground">
                  When reading newsletters or articles, click &quot;Share via Email&quot; and send to your ReadFlow address
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Automatic Conversion</h4>
                <p className="text-sm text-muted-foreground">
                  We convert the article to EPUB format optimized for Kindle reading
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Kindle Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  The converted article appears in your Kindle library automatically
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}