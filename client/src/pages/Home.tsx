import {
  HeroSection,
  PlatformHighlights,
  FeaturedCourses,
  WhyEduFlow,
  HowItWorks,
  LearningExperience,
  PlatformCapabilities,
  FAQSection,
  FinalCTA,
} from '@/components/home'

export default function Home() {
  return (
    <>
      <HeroSection />
      <PlatformHighlights />
      <FeaturedCourses />
      <WhyEduFlow />
      <HowItWorks />
      <LearningExperience />
      <PlatformCapabilities />
      <FAQSection />
      <FinalCTA />
    </>
  )
}

