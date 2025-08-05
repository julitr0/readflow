import { IconBook2, IconFileText, IconCrown } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface UsageCardsProps {
  articlesUsed: number;
  articlesLimit: number;
  totalConversions: number;
  subscriptionTier: 'starter' | 'pro';
}

export function UsageCards({
  articlesUsed,
  articlesLimit,
  totalConversions,
  subscriptionTier,
}: UsageCardsProps) {
  const usagePercentage = Math.round((articlesUsed / articlesLimit) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Monthly Usage Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {articlesUsed} / {articlesLimit}
          </CardTitle>
          <CardAction>
            <Badge 
              variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
            >
              <IconFileText className="w-3 h-3" />
              {usagePercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 text-sm">
          <Progress value={usagePercentage} className="w-full" />
          <div className="flex flex-col gap-1">
            <div className="font-medium">
              {isAtLimit 
                ? "Limit reached - upgrade to continue" 
                : isNearLimit 
                ? "Approaching monthly limit"
                : "Articles converted this month"
              }
            </div>
            {isNearLimit && (
              <Link href="/dashboard/payment">
                <Button size="sm" variant={isAtLimit ? "default" : "outline"}>
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Total Conversions Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Articles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {totalConversions.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBook2 className="w-3 h-3" />
              All time
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Successfully converted articles
          </div>
          <div className="text-muted-foreground">
            Ready for distraction-free reading
          </div>
        </CardFooter>
      </Card>

      {/* Subscription Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Plan</CardDescription>
          <CardTitle className="text-2xl font-semibold capitalize">
            {subscriptionTier}
          </CardTitle>
          <CardAction>
            <Badge variant={subscriptionTier === 'pro' ? "default" : "secondary"}>
              {subscriptionTier === 'pro' ? <IconCrown className="w-3 h-3" /> : <IconFileText className="w-3 h-3" />}
              {subscriptionTier === 'pro' ? 'Pro' : 'Starter'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <div className="font-medium">
              {articlesLimit} articles per month
            </div>
            <div className="text-muted-foreground">
              ${subscriptionTier === 'pro' ? '7' : '3'}/month
            </div>
          </div>
          {subscriptionTier === 'starter' && (
            <Link href="/dashboard/payment">
              <Button size="sm" variant="outline">
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}