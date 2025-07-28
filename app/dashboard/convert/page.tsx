import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConversionForm } from "@/components/conversion/conversion-form";
import { ConversionsList } from "@/components/conversion/conversions-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, History } from "lucide-react";

export default async function ConvertPage() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-start justify-center gap-2 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Convert to Kindle
          </h1>
          <p className="text-muted-foreground">
            Transform your newsletters and articles into distraction-free reading on your Kindle
          </p>
        </div>

        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="convert" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Convert Article
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Conversion History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="convert" className="mt-6">
            <ConversionForm />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <ConversionsList />
          </TabsContent>
        </Tabs>

        {/* Usage Stats */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Track your conversion usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-muted-foreground">Articles Converted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">100</div>
                  <div className="text-sm text-muted-foreground">Monthly Limit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">100</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
} 