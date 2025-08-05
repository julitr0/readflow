import { Card, CardContent } from "@/components/ui/card";
import { Zap, Image, BookOpen, Smartphone } from "lucide-react";

export default function FeaturesBenefits() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Articles delivered to your Kindle in under 5 minutes. No more waiting around.",
      highlight: "< 5 minutes",
    },
    {
      icon: Image,
      title: "Rich Media Preserved",
      description:
        "Images, formatting, and layout perfectly maintained in Kindle-optimized format.",
      highlight: "100% Quality",
    },
    {
      icon: BookOpen,
      title: "Native Kindle Format",
      description:
        "True EPUB conversion creates seamless reading experience with adjustable fonts and margins.",
      highlight: "Native EPUB",
    },
    {
      icon: Smartphone,
      title: "100+ Platforms Supported",
      description:
        "Works with Substack, Medium, ConvertKit, Beehiiv, and virtually any newsletter platform.",
      highlight: "100+ Sources",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-balance text-3xl font-semibold md:text-4xl mb-4">
            Why ReadFlow Works Better
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built for speed, quality, and compatibility. Experience the
            difference with professional-grade newsletter conversion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="relative p-6 text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-0">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-2">
                      {feature.highlight}
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-6 bg-background px-6 py-4 rounded-full border shadow-sm">
            <span className="text-sm font-medium">
              Trusted by 1,000+ readers
            </span>
            <div className="w-px h-4 bg-border"></div>
            <span className="text-sm text-muted-foreground">
              99.9% success rate
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
