'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search, Menu, BookOpen } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { ModeToggle } from '@/components/layout/ModeToggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const routes = [
  {
    href: '/courses',
    label: 'Courses',
    active: (pathname: string) => pathname === '/courses',
  },
  {
    href: '/about',
    label: 'About',
    active: (pathname: string) => pathname === '/about',
  },
  {
    href: '/pricing',
    label: 'Pricing',
    active: (pathname: string) => pathname === '/pricing',
  },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav className="flex flex-col gap-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    route.active(pathname)
                      ? 'text-black dark:text-white'
                      : 'text-muted-foreground'
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:gap-8">
          <Link href="/" className="hidden items-center space-x-2 md:flex">
            <BookOpen className="h-6 w-6" />
            <span className="font-bold">MoocFlix</span>
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {routes.map((route) => (
                <NavigationMenuItem key={route.href}>
                  <Link href={route.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        route.active(pathname) && 'text-primary'
                      )}
                    >
                      {route.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            <ModeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}