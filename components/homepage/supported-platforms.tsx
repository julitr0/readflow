import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function SupportedPlatforms() {
  const platforms = [
    { name: "Substack", logo: "/logos/substack-logo.png", description: "Newsletter platform" },
    { name: "Medium", logo: "/logos/medium-logo.svg", description: "Publishing platform" },
    { name: "ConvertKit", logo: "📧", description: "Email marketing" },
    { name: "Beehiiv", logo: "🐝", description: "Newsletter tool" },
    { name: "Stratechery", logo: "📊", description: "Business analysis" },
    { name: "TechCrunch", logo: "/logos/techcrunch-logo.svg", description: "Tech news" },
    { name: "The Hustle", logo: "💼", description: "Business news" },
    { name: "Morning Brew", logo: "☕", description: "Daily newsletter" },
    { name: "Every.to", logo: "📝", description: "Newsletter discovery" },
    { name: "Ghost", logo: "/logos/ghost-logo.png", description: "Publishing platform" },
    { name: "Mailchimp", logo: "/logos/mailchimp-logo.png", description: "Email service" },
    { name: "Custom HTML", logo: "⚡", description: "Any newsletter" },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-balance text-3xl font-semibold md:text-4xl mb-4">
            Works With Your Favorite Newsletters
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Link to Reader supports 100+ newsletter platforms and formats. If you can
            email it, we can convert it to your Kindle.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {platforms.map((platform, index) => (
            <Card
              key={index}
              className="p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center gap-2">
                {platform.logo.startsWith('/') ? (
                  <div className="w-8 h-8 relative">
                    <Image
                      src={platform.logo}
                      alt={`${platform.name} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-2xl">{platform.logo}</span>
                )}
                <h3 className="font-medium text-sm">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {platform.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-background px-6 py-4 rounded-full border shadow-sm">
            <span className="font-medium">Can&apos;t find your newsletter?</span>
            <span className="text-sm text-muted-foreground">
              Send us the format and we&apos;ll add support within 24 hours
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
