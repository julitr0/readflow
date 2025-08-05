import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah M.",
      role: "Newsletter Enthusiast",
      content:
        "ReadFlow has transformed how I consume content. My Kindle is now my go-to for reading newsletters, and the formatting is perfect. The pricing is unbeatable compared to alternatives.",
      rating: 5,
      highlight: "Perfect formatting",
    },
    {
      name: "David K.",
      role: "Startup Founder",
      content:
        "I read 50+ newsletters monthly for research. ReadFlow saves me hours and reduces eye strain significantly. The conversion speed is incredible - articles appear on my Kindle within minutes.",
      rating: 5,
      highlight: "Saves hours daily",
    },
    {
      name: "Maria L.",
      role: "Content Creator",
      content:
        "As someone who struggled with ReadBetter's complex setup, ReadFlow was a breath of fresh air. Two clicks and I'm reading distraction-free. Customer support actually responds too!",
      rating: 5,
      highlight: "Simple setup",
    },
    {
      name: "James R.",
      role: "Finance Professional",
      content:
        "I switched from ReadBetter after they raised prices. ReadFlow gives me 10x more articles for less money, plus the conversion quality is just as good. No brainer decision.",
      rating: 5,
      highlight: "10x more value",
    },
    {
      name: "Emily C.",
      role: "Researcher",
      content:
        "The rich media preservation is outstanding. Images, charts, and formatting all come through perfectly on my Kindle. Finally found a service that just works.",
      rating: 5,
      highlight: "Rich media support",
    },
    {
      name: "Alex P.",
      role: "Tech Executive",
      content:
        "ReadFlow's dashboard is clean and mobile-friendly unlike the competition. I can manage everything from my phone and the conversion history is super helpful for finding old articles.",
      rating: 5,
      highlight: "Mobile-friendly",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-balance text-3xl font-semibold md:text-4xl mb-4">
            Loved by 1,000+ Readers
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of happy readers who&apos;ve made the switch to
            distraction-free reading with ReadFlow.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9/5</span>
            <span className="text-muted-foreground">from 1,000+ reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="relative p-6 hover:shadow-lg transition-shadow"
            >
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <div className="mb-4">
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                    {testimonial.highlight}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    &quot;{testimonial.content}&quot;
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="font-semibold text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 bg-background px-6 py-4 rounded-full border shadow-sm">
            <span className="text-sm font-medium">
              Join 1,000+ satisfied customers
            </span>
            <div className="w-px h-4 bg-border"></div>
            <span className="text-sm text-muted-foreground">
              7-day free trial
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
