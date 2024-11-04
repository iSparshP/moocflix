import HeroSection from "@/components/layout/HeroSection"
import FeaturedCourses from "@/components/courses/FeaturedCourses"
import {Categories} from "@/components/courses/Categories"
import Testimonials from "@/components/layout/Testimonials"

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturedCourses />
      <Categories />
      <Testimonials />
    </main>
  )
}