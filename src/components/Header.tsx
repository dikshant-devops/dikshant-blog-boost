import { Link, useLocation } from "react-router-dom";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, TerminalSquare } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { to: "/", label: "Home", exact: true },
  { to: "/blog", label: "Articles", exact: false },
  { to: "/about", label: "About", exact: true },
  { to: "/connect", label: "Connect", exact: true },
];

export const Header = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Memoize theme toggle handler - prevents new function creation on every render
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const isActive = (link: typeof navLinks[0]) =>
    link.exact
      ? location.pathname === link.to
      : location.pathname.startsWith(link.to);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-xl">
      <div className="content-shell flex h-16 items-center justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Tech With Dikshant home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <TerminalSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold md:text-base">Tech With Dikshant</div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">DevOps field notes</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                isActive(link) ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0"
            title="Toggle color theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/newsletter">Get field notes</Link>
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Tech With Dikshant</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      isActive(link) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/newsletter"
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-medium transition-colors hover:text-primary text-muted-foreground"
                >
                  Subscribe
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
