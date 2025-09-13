import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CompetitiveComparison() {
  const features = [
    {
      feature: "Monthly Articles",
      readflow: "100 articles",
      readbetter: "10 articles",
      readflowWins: true,
    },
    {
      feature: "Monthly Price",
      readflow: "$4.99",
      readbetter: "$5",
      readflowWins: true,
    },
    {
      feature: "Value per Article",
      readflow: "$0.05",
      readbetter: "$0.50",
      readflowWins: true,
    },
    {
      feature: "Conversion Speed",
      readflow: "< 5 minutes",
      readbetter: "< 10 minutes",
      readflowWins: true,
    },
    {
      feature: "Rich Media Support",
      readflow: "✓ Full support",
      readbetter: "✓ Basic support",
      readflowWins: true,
    },
    {
      feature: "Platform Support",
      readflow: "100+ platforms",
      readbetter: "100+ platforms",
      readflowWins: false,
    },
    {
      feature: "Setup Complexity",
      readflow: "Simple 2-step",
      readbetter: "Complex forwarding",
      readflowWins: true,
    },
    {
      feature: "Customer Support",
      readflow: "Email + Chat",
      readbetter: "Email only",
      readflowWins: true,
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-100">
            Honest Comparison
          </Badge>
          <h2 className="text-balance text-3xl font-semibold md:text-4xl mb-4">
            Link to Reader vs ReadBetter.io
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Both services deliver newsletters to Kindle, but Link to Reader offers
            significantly better value and a superior user experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Link to Reader Card */}
          <Card className="relative border-primary/50 shadow-lg">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Link to Reader (Recommended)
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl">Link to Reader</CardTitle>
              <div className="text-3xl font-bold text-primary">$4.99/month</div>
              <p className="text-sm text-muted-foreground">
                100 articles • Better value
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm">100 articles per month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Lightning fast conversion</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Modern, simple setup</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Email + chat support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Mobile-optimized dashboard</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* ReadBetter Card */}
          <Card className="relative opacity-75">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">ReadBetter.io</CardTitle>
              <div className="text-3xl font-bold">$5/month</div>
              <p className="text-sm text-muted-foreground">
                10 articles • Limited value
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm line-through text-muted-foreground">
                    Only 10 articles per month
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Fast conversion</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm line-through text-muted-foreground">
                    Complex email forwarding
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm line-through text-muted-foreground">
                    Email support only
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm line-through text-muted-foreground">
                    Desktop-only design
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">
              Detailed Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4 text-primary font-semibold">
                      Link to Reader
                    </th>
                    <th className="text-center py-3 px-4">ReadBetter.io</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{item.feature}</td>
                      <td
                        className={`text-center py-3 px-4 ${item.readflowWins ? "text-primary font-semibold" : ""}`}
                      >
                        {item.readflow}
                      </td>
                      <td className="text-center py-3 px-4 text-muted-foreground">
                        {item.readbetter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-6 py-3 rounded-full border border-green-200">
            <span className="font-semibold">💰 Better Value</span>
            <span>•</span>
            <span>Get 10x more articles</span>
            <span>•</span>
            <span>Better experience</span>
          </div>
        </div>
      </div>
    </section>
  );
}
