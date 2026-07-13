import Hero from '../components/landing/Hero'
import About from '../components/landing/About'
import CoreFeatures from '../components/landing/CoreFeatures'
import RecommendationSection from '../components/landing/RecommendationSection'
import HowItWorks from '../components/landing/HowItWorks'
import Statistics from '../components/landing/Statistics'
import FAQ from '../components/landing/FAQ'
import Contact from '../components/landing/Contact'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <About />
      <CoreFeatures />
      <RecommendationSection />
      <HowItWorks />
      <Statistics />
      <FAQ />
      <Contact />
    </>
  )
}
