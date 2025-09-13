import { Card, CardContent } from "@/components/ui/card";
import { Mail, Zap, BookOpen } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Mail,
      title: "Forward any newsletter",
      description:
        "Send newsletters and articles to your unique Link to Reader email address using your email app's share/forward feature.",
      step: "01",
    },
    {
      icon: Zap,
      title: "We convert automatically",
      description:
        "Our system processes your content and converts it to a clean, Kindle-optimized EPUB format in minutes.",
      step: "02",
    },
    {
      icon: BookOpen,
      title: "Read distraction-free",
      description:
        "Receive the converted article on your Kindle device and enjoy focused reading without ads or distractions.",
      step: "03",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-balance text-3xl font-semibold md:text-4xl mb-4">
            How Link to Reader Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transform any newsletter into distraction-free reading in just three
            simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative p-6 text-center">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                    {step.step}
                  </div>
                </div>
                <CardContent className="pt-8 pb-0">
                  <div className="mb-6 flex justify-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-background px-4 py-2 rounded-full border">
            <span className="text-sm text-muted-foreground">
              Works with Substack, Medium, ConvertKit, and more
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
