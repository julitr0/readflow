import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
        {/* Logo - Left Side */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LR</span>
            </div>
            <span className="text-xl font-semibold">Link to Reader</span>
          </Link>
        </div>

        {/* Navigation Buttons - Right Side */}
        <div className="flex items-center space-x-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">
              Sign In
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">
              Sign Up
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}