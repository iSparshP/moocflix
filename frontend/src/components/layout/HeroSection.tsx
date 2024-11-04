import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Award } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative">
      <div className="container flex flex-col items-center gap-8 py-16 md:py-24">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Transform Your Future with
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {' '}
              Expert-Led Courses
            </span>
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Join millions of learners worldwide and master new skills with our
            comprehensive online courses. Learn from industry experts at your own pace.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/courses">
            <Button size="lg">
              Explore Courses
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">500+ Courses</h3>
              <p className="text-sm text-muted-foreground">
                In various domains
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">50k+ Students</h3>
              <p className="text-sm text-muted-foreground">
                Learning worldwide
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Expert Instructors</h3>
              <p className="text-sm text-muted-foreground">
                Industry leaders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;