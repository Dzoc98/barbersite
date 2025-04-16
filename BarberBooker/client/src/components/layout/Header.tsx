import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";

const Header: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Scissors className="text-white h-5 w-5" />
          </div>
          <span className="font-heading text-primary text-xl font-bold">BarberStyle</span>
        </Link>
        
        {!user && (
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-accent">ACCEDI</Button>
            </Link>
            <Link href="/register">
              <Button className="font-accent bg-accent hover:bg-accent-dark">REGISTRATI</Button>
            </Link>
          </div>
        )}
        
        {user && !isAdmin && (
          <div className="flex items-center gap-4">
            <Link href="/appointments" className="text-primary hover:text-accent transition-colors">
              Le mie prenotazioni
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <span>{user.firstName}</span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <i className="fas fa-user mr-2"></i> Profilo
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/appointments" className="cursor-pointer">
                    <i className="fas fa-calendar-alt mr-2"></i> Prenotazioni
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  <i className="fas fa-sign-out-alt mr-2"></i> Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {user && isAdmin && (
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary hover:text-accent transition-colors">
              Dashboard
            </Link>
            <Link href="/clients" className="text-primary hover:text-accent transition-colors">
              Clienti
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <span>Admin</span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled className="cursor-pointer">
                  <i className="fas fa-cog mr-2"></i> Impostazioni
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  <i className="fas fa-sign-out-alt mr-2"></i> Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
