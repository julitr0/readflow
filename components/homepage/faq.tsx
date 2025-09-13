import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "How do I send newsletters to my Kindle?",
      answer:
        "Simply forward any newsletter or article to your unique Link to Reader email address (like john@linktoreader.com). We'll automatically convert it and send it to your Kindle within 5 minutes.",
    },
    {
      question: "What newsletter platforms do you support?",
      answer:
        "We support 100+ platforms including Substack, Medium, ConvertKit, Beehiiv, Ghost, Mailchimp, and virtually any HTML email newsletter. If you can email it, we can convert it.",
    },
    {
      question: "How is this different from ReadBetter.io?",
      answer:
        "Link to Reader offers 10x more articles per dollar ($3 for 100 articles vs $5 for 10 articles), faster conversion times, simpler setup, and better customer support. Same quality, much better value.",
    },
    {
      question: "Do images and formatting work on Kindle?",
      answer:
        "Yes! We preserve images, charts, formatting, and layout in Kindle-optimized format. Everything displays beautifully with adjustable fonts and margins on your device.",
    },
    {
      question: "How long does conversion take?",
      answer:
        "Most articles are converted and delivered to your Kindle within 5 minutes. Complex articles with lots of media may take up to 10 minutes.",
    },
    {
      question: "Can I use this with Kindle Unlimited?",
      answer:
        "Absolutely! Link to Reader works with all Kindle devices and doesn't interfere with Kindle Unlimited or any other Amazon services. The articles appear in your personal documents.",
    },
    {
      question: "What if my newsletter format isn't supported?",
      answer:
        "Send us a sample and we'll add support within 24 hours. Our team continuously adds new format support based on user requests.",
    },
    {
      question: "Is there a setup fee or contract?",
      answer:
        "No setup fees, no contracts. Start with a 7-day free trial, then pay monthly. Cancel anytime with no penalties.",
    },
    {
      question: "How do I find my Kindle email address?",
      answer:
        "Go to Amazon's Manage Your Content and Devices page, find your Kindle, and look for the email address ending in @kindle.com. We provide detailed setup instructions after signup.",
    },
    {
      question: "What happens if I exceed my monthly limit?",
      answer:
        "We'll notify you when you reach 80% of your limit. If you exceed it, conversions pause until next month or you can upgrade to a higher plan instantly.",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-balance text-3xl font-semibold md:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about Link to Reader. Can&apos;t find what you&apos;re
            looking for? Email us at support@linktoreader.com
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-muted/50 px-6 py-4 rounded-lg">
            <span className="font-medium">Still have questions?</span>
            <span className="text-sm text-muted-foreground">
              Email us at{" "}
              <a
                href="mailto:support@linktoreader.com"
                className="text-primary hover:underline"
              >
                support@linktoreader.com
              </a>{" "}
              and we&apos;ll respond within 24 hours
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
