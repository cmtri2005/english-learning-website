import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Blog", href: "/blog" },
    { label: "Forum", href: "/forum" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  const isActive = (href: string) => location.pathname === href;

  // Helper function to get user initial safely
  const getUserInitial = () => {
    if (user?.name && user.name.length > 0) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Helper function to get user display name safely
  const getUserDisplayName = () => {
    return user?.name || user?.email || 'User';
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl">
          <img 
            src="/logo_monolingo.png" 
            alt="Monolingo Logo" 
            className="h-16 w-auto"
          />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Monolingo
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className="text-sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex gap-2 items-center">
          {/* Notification Bell */}
          {isLoggedIn && (
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          )}

          {/* Avatar Dropdown or Auth Buttons */}
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                    {getUserInitial()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {getUserDisplayName()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    {getUserInitial()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{getUserDisplayName()}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="text-xs text-primary capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/purchases" className="cursor-pointer">
                    My Purchase
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer text-primary">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t bg-background/95">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className="w-full justify-start text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              {isLoggedIn && user ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-2 bg-muted rounded-md">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                      {getUserInitial()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{getUserDisplayName()}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="text-xs text-primary capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <Link to="/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Button>
                  </Link>
                  <Link to="/purchases">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      My Purchase
                    </Button>
                  </Link>
                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <div className="mt-2 pt-2 border-t">
                      <Link to="/admin">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          Admin Dashboard
                        </Button>
                      </Link>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full text-red-600"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate("/login");
                      setIsOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      navigate("/register");
                      setIsOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
