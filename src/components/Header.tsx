import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Search, User, LogOut, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIAS = ["Medicamentos", "Manipulacao", "Suplementos", "Vitaminas", "Higiene Pessoal", "Dermocosmeticos"];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${light ? "bg-amber" : "bg-primary"}`}>
        <Plus className={`h-4 w-4 ${light ? "text-primary" : "text-white"}`} strokeWidth={3} />
      </div>
      <span className="font-display text-xl font-extrabold tracking-tight leading-none">
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
    if (q.trim()) navigate({ to: "/produtos", search: { q } as any });
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Announcement bar */}
      <div className="bg-primary text-white">
        <div className="container mx-auto px-4 py-1.5 text-center text-xs font-medium">
          Frete grátis acima de R$ 199 · <span className="text-amber font-bold">10% OFF no PIX</span> · Entrega expressa
        </div>
      </div>

      {/* Main bar */}
      <div className="container mx-auto flex items-center gap-2 px-4 py-3">
        <Link to="/" className="shrink-0"><Logo /></Link>

        {/* Busca desktop */}
        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-10 h-10 rounded-full border-border bg-surface"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto">
          {/* Busca mobile */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setShowSearch((s) => !s)}>
            {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Conta */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary px-2">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">{user ? "Conta" : "Entrar"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground font-normal">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/conta" })}>Minha conta</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/pedidos" })}>Meus pedidos</DropdownMenuItem>
                  {(isAdmin || isFuncionario) && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>Painel Admin</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />Sair
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>Entrar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/cadastro" })}>Criar conta</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Carrinho */}
          <Button asChild variant="ghost" size="sm" className="relative gap-1.5 text-primary px-2">
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

      {/* Busca mobile expandida */}
      {showSearch && (
        <form onSubmit={submitSearch} className="md:hidden container mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-10 h-10 rounded-full bg-surface"
            />
          </div>
        </form>
      )}

      {/* Categorias */}
      <nav className="border-t border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Link to="/produtos" search={{} as any}
              className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              Todos
            </Link>
            {CATEGORIAS.map((c) => (
              <Link key={c} to="/produtos" search={{ categoria: c } as any}
                className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary transition whitespace-nowrap">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
