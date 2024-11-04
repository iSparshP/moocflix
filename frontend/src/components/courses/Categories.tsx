'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Code, Palette, Database, Camera, Music, Brain } from 'lucide-react';
import Link from 'next/link';

const categories = [
  {
    title: 'Programming',
    icon: Code,
    description: 'Learn to code with modern languages and frameworks',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    title: 'Design',
    icon: Palette,
    description: 'Master digital design and creative tools',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    title: 'Data Science',
    icon: Database,
    description: 'Analyze data and build ML models',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    title: 'Photography',
    icon: Camera,
    description: 'Capture stunning photos and edit like a pro',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    title: 'Music',
    icon: Music,
    description: 'Learn instruments and music production',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    title: 'AI & ML',
    icon: Brain,
    description: 'Explore artificial intelligence and machine learning',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
];

export function Categories() {
  return (
    <section className="container py-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Browse Categories</h2>
        <p className="text-muted-foreground">
          Explore our wide range of courses across different categories.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.title} href={`/courses?category=${category.title.toLowerCase()}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex gap-4 p-4">
                  <div className={`rounded-lg p-2 ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}