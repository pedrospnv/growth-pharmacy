import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Search, User, LogOut, Leaf, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIAS = ["Medicamentos", "Vitaminas", "Higiene Pessoal", "Dermocosméticos", "Suplementos"];

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/produtos", search: { q: q || undefined } as any });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="border-b border-border/40 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-1.5 text-center text-xs font-medium tracking-wide">
          Frete grátis acima de R$ 199 · 10% OFF no PIX · Entrega expressa
        </div>
      </div>
      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-accent text-primary-foreground shadow-glow">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-extrabold tracking-tight">biofarma</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">sua saúde+</span>
          </div>
        </Link>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busque medicamentos, vitaminas, dermocosméticos..."
              className="pl-9 h-11 rounded-full border-border bg-muted/40"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline text-sm">{user ? "Minha conta" : "Entrar"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/conta" })}>Minha conta</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/conta" })}>Meus pedidos</DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>Painel Admin</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => signOut()}><LogOut className="h-4 w-4 mr-2" />Sair</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>Entrar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/cadastro" })}>Criar conta</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="ghost" size="sm" className="relative gap-2">
            <Link to="/carrinho">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Carrinho</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
      <nav className="border-t border-border/60 bg-muted/30">
        <div className="container mx-auto flex items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
          <Menu className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
          {CATEGORIAS.map((c) => (
            <Link
              key={c}
              to="/produtos"
              search={{ categoria: c } as any}
              className="shrink-0 rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
            >
              {c}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
