import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col gap-8 py-12 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:gap-16">
          <div className="flex flex-col gap-4 md:w-1/3">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold">MoocFlix</span>
            </Link>
            <p className="text-muted-foreground">
              Empowering learners worldwide with high-quality online education.
              Learn at your own pace, anywhere, anytime.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Platform</h3>
              <Link href="/courses" className="text-muted-foreground hover:text-primary">Courses</Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary">About</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Support</h3>
              <Link href="/help" className="text-muted-foreground hover:text-primary">Help Center</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Legal</h3>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary">Terms</Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary">Cookies</Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} MoocFlix. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-primary">Twitter</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">GitHub</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">Discord</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}