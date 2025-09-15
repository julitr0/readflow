"use client";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function ManageSubscription() {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          // TODO: Implement customer portal when payment plugin is configured
          console.log("Customer portal not yet implemented");
        } catch (error) {
          console.error("Failed to open customer portal:", error);
        }
      }}
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      Manage Subscription
    </Button>
  );
}
