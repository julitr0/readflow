import CompetitiveComparison from "@/components/homepage/competitive-comparison";
import FAQ from "@/components/homepage/faq";
import FeaturesBenefits from "@/components/homepage/features-benefits";
import FooterSection from "@/components/homepage/footer";
import Header from "@/components/homepage/header";
import HeroSection from "@/components/homepage/hero-section";
import HowItWorks from "@/components/homepage/how-it-works";
import SupportedPlatforms from "@/components/homepage/supported-platforms";
import Testimonials from "@/components/homepage/testimonials";
import { getSubscriptionDetails } from "@/lib/subscription";
import PricingTable from "./pricing/_component/pricing-table";

export default async function Home() {
  const subscriptionDetails = await getSubscriptionDetails();

  return (
    <>
      <Header />
      <HeroSection />
      <FeaturesBenefits />
      <HowItWorks />
      <SupportedPlatforms />
      <Testimonials />
      <CompetitiveComparison />
      <PricingTable subscriptionDetails={subscriptionDetails} />
      <FAQ />
      <FooterSection />
    </>
  );
}
