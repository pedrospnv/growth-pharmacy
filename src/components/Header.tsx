import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Search, User, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIAS = ["Medicamentos", "Manipulação", "Suplementos", "Vitaminas", "Higiene Pessoal", "Dermocosméticos"];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${light ? "bg-amber" : "bg-primary"}`}>
        <Plus className={`h-5 w-5 ${light ? "text-primary" : "text-white"}`} strokeWidth={3} />
      </div>
      <span className="font-display text-2xl font-extrabold tracking-tight leading-none">
        <span className={light ? "text-white" : "text-primary"}>farma</span>
        <span className="text-amber">pro</span>
      </span>
    </div>
  );
}

export function Header() {
  const { user, isAdmin, isFuncionario, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/produtos", search: { q: q || undefined } as any });
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Announcement bar */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-2 text-center text-xs font-medium">
          Frete grátis acima de R$ 199 · <span className="text-amber font-bold">10% OFF no PIX</span> · Entrega expressa
        </div>
      </div>

      {/* Main bar */}
      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        <Link to="/" className="shrink-0"><Logo /></Link>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-2xl ml-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-10 h-11 rounded-lg border-border bg-surface focus-visible:ring-primary"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowSearch((s) => !s)}>
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-primary">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">{user ? "Minha conta" : "Entrar"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
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

          <Button asChild variant="ghost" size="sm" className="relative gap-2 text-primary">
            <Link to="/carrinho">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Carrinho</span>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1 text-[10px] font-bold text-primary">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {showSearch && (
        <form onSubmit={submitSearch} className="md:hidden container mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produtos..." className="pl-10 h-11 rounded-lg bg-surface" />
          </div>
        </form>
      )}

      {/* Categories pills */}
      <nav className="border-t border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Link
              to="/produtos"
              search={{} as any}
              className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
            >
              Todos
            </Link>
            {CATEGORIAS.map((c) => (
              <Link
                key={c}
                to="/produtos"
                search={{ categoria: c } as any}
                className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary transition"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
