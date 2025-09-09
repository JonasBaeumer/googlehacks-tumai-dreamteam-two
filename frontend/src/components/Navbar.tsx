import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Code2, User, Chrome, LogIn, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const Navbar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                CodeStreak
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">
                Gamified Learning Tracker
              </p>
            </div>
          </div>

          {/* Center - Simulated User Chip */}
          <div className="flex-1 flex justify-center">
            <Badge 
              variant="outline" 
              className="flex items-center gap-2 px-3 py-1 text-sm border-primary/20 bg-primary/5"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">Demo User</span>
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            </Badge>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hidden sm:flex"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Connect Extension CTA */}
            <Button size="sm" variant="outline" className="gap-2">
              <Chrome className="h-4 w-4" />
              <span className="hidden sm:inline">Connect Extension</span>
            </Button>

            {/* Sign in with Google */}
            <Button size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in with Google</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;