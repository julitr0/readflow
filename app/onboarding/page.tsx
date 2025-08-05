"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Smartphone, BookOpen, ArrowRight, ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const steps = [
  {
    id: "welcome",
    title: "Welcome to ReadFlow!",
    description: "Transform your newsletters into distraction-free Kindle reading"
  },
  {
    id: "how-it-works",
    title: "How ReadFlow Works",
    description: "Three simple steps to get started"
  },
  {
    id: "kindle-setup",
    title: "Connect Your Kindle",
    description: "We need your Kindle email to send converted articles"
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [kindleEmail, setKindleEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateKindleEmail = (email: string): boolean => {
    // Amazon uses different Kindle email domains for different regions
    const kindleEmailRegex = /^[a-zA-Z0-9._%+-]+@kindle\.(com|cn|co\.uk|de|fr|co\.jp|it|es|com\.br|in|com\.mx|ca|com\.au)$/;
    return kindleEmailRegex.test(email);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Final step - save Kindle email and complete onboarding
      if (!kindleEmail.trim()) {
        toast.error("Please enter your Kindle email address");
        return;
      }

      if (!validateKindleEmail(kindleEmail)) {
        toast.error("Please enter a valid Kindle email address (e.g., @kindle.com, @kindle.co.uk)");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/user/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kindleEmail: kindleEmail.trim(),
            onboardingComplete: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save settings");
        }

        toast.success("Welcome to ReadFlow! Your setup is complete.");
        router.push("/dashboard");
      } catch (error) {
        toast.error("Failed to save your settings. Please try again.");
        console.error("Onboarding completion error:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-blue-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-4">Welcome to ReadFlow!</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transform your favorite newsletters and articles into beautifully formatted 
          books for distraction-free reading on your Kindle.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="p-4 border rounded-lg">
          <Mail className="w-8 h-8 text-green-600 mb-2 mx-auto" />
          <h3 className="font-semibold">Forward Emails</h3>
          <p className="text-sm text-muted-foreground">
            Forward newsletters to your personal ReadFlow address
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <Smartphone className="w-8 h-8 text-blue-600 mb-2 mx-auto" />
          <h3 className="font-semibold">Convert URLs</h3>
          <p className="text-sm text-muted-foreground">
            Paste article URLs directly into ReadFlow
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <BookOpen className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
          <h3 className="font-semibold">Read on Kindle</h3>
          <p className="text-sm text-muted-foreground">
            Receive beautifully formatted books on your Kindle
          </p>
        </div>
      </div>
    </div>
  );

  const renderHowItWorksStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">How ReadFlow Works</h2>
        <p className="text-lg text-muted-foreground">
          Two ways to send articles, one seamless reading experience
        </p>
      </div>
      
      {/* Two Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
        <div className="p-6 border rounded-lg bg-blue-50">
          <Mail className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Method 1: Email Articles</h3>
          <p className="text-sm text-muted-foreground">
            Forward any newsletter or article email to your personal ReadFlow address
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-green-50">
          <Smartphone className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Method 2: Paste URLs</h3>
          <p className="text-sm text-muted-foreground">
            Copy article URLs from Substack, Medium, blogs, or any website
          </p>
        </div>
      </div>
      
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold">1</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Send Us Your Article</h3>
            <p className="text-muted-foreground">
              Either forward emails to your ReadFlow address or paste article URLs directly into the app.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-bold">2</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">We Convert & Format</h3>
            <p className="text-muted-foreground">
              ReadFlow extracts the content, removes ads and distractions, and formats it perfectly for Kindle reading.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-purple-600 font-bold">3</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Delivered to Your Kindle</h3>
            <p className="text-muted-foreground">
              The converted article appears in your Kindle library within minutes, ready for distraction-free reading.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg max-w-2xl mx-auto text-center">
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="font-medium">
          No more switching between apps or getting distracted by notifications while reading!
        </p>
      </div>
    </div>
  );

  const renderKindleSetupStep = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <Send className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Connect Your Kindle</h2>
        <p className="text-lg text-muted-foreground">
          We need your Kindle email address to send converted articles directly to your device.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="kindle-email" className="text-base font-medium">
            Kindle Email Address
          </Label>
          <Input
            id="kindle-email"
            type="email"
            placeholder="yourname@kindle.com"
            value={kindleEmail}
            onChange={(e) => setKindleEmail(e.target.value)}
            className="text-base h-12 mt-2"
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground mt-2">
            This should end with a Kindle domain (e.g., @kindle.com, @kindle.co.uk, @kindle.de)
          </p>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">📍 How to find your Kindle email:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to Amazon&apos;s &quot;Manage Your Content and Devices&quot; page</li>
            <li>Click on your Kindle device</li>
            <li>Look for &quot;Send-to-Kindle Email&quot; - that&apos;s your address!</li>
          </ol>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">🔒 Why we need this:</h4>
          <p className="text-sm text-muted-foreground">
            Your Kindle email is how Amazon delivers content to your device. 
            We use it to send your converted articles directly to your Kindle library.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderHowItWorksStep();
      case 2:
        return renderKindleSetupStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full mb-2" />
        </div>

        {/* Content */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 md:p-12">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center items-center mt-8 gap-4 max-w-md mx-auto">
          {currentStep === 0 ? (
            <div className="flex-1"></div>
          ) : (
            <Button
              onClick={handleBack}
              disabled={isSubmitting}
              variant="ghost"
              size="lg"
              className="px-8 py-3 text-base min-w-32 flex-1 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            size="lg"
            className="px-8 py-3 text-base min-w-32 flex-1"
          >
            {isSubmitting ? (
              "Saving..."
            ) : currentStep === steps.length - 1 ? (
              "Complete Setup"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}