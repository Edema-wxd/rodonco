import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MenuPreview } from "@/components/landing/MenuPreview";
import { TrendingRecipes } from "@/components/landing/TrendingRecipes";
import { CleanPromise } from "@/components/landing/CleanPromise";
import { Testimonials } from "@/components/landing/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <MenuPreview />
      <TrendingRecipes />
      <CleanPromise />
      <Testimonials />
    </>
  );
}
