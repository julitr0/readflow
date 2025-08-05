import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="py-20">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content - Left Side */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-medium text-balance mb-6">
              Transform newsletters into distraction-free reading on your Kindle
            </h1>
            <p className="text-muted-foreground text-lg lg:text-xl text-balance mb-8">
              ReadFlow delivers your favorite email newsletters and articles to
              Kindle in native e-book format. Read without distractions and with
              less eye strain.
            </p>
            <div className="flex flex-col items-center lg:items-start gap-4 sm:flex-row sm:gap-4">
              <Button asChild variant="default" size="lg" className="w-full sm:w-auto">
                <Link href="/sign-up" prefetch={true}>
                  <span className="text-nowrap">
                    Start Reading Better - $4.99/month
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="#how-it-works">
                  <span className="text-nowrap">See How It Works</span>
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Join thousands of happy readers • 7-day free trial
            </p>
          </div>

          {/* Kindle Device - Right Side */}
          <div className="relative">
            <div className="relative mx-auto max-w-md">
              <Image
                src="/kindle-device.avif"
                alt="Amazon Kindle Paperwhite e-reader device"
                width={400}
                height={500}
                className="w-full h-auto drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}