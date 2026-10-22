import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Produto } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";

const searchSchema = z.object({
  categoria: z.string().optional(),
  q: z.string().optional(),
});

const CATEGORIAS = ["Medicamentos", "Manipulação", "Suplementos", "Vitaminas", "Higiene Pessoal", "Dermocosméticos"];

export const Route = createFileRoute("/produtos")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Catálogo — Farma Pro" }, { name: "description", content: "Catálogo completo Farma Pro." }] }),
  component: Produtos,
});

function Produtos() {
  const { categoria, q: qParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(qParam ?? "");
  const [maxPreco, setMaxPreco] = useState<number>(300);
  const [showFilters, setShowFilters] = useState(false);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco,categoria,imagem_url,desconto,estoque")
        .order("nome");
      return (data ?? []) as Produto[];
    },
  });

  const filtered = useMemo(() => {
    return produtos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (q && !p.nome.toLowerCase().includes(q.toLowerCase())) return false;
      if (p.preco > maxPreco) return false;
      return true;
    });
  }, [produtos, categoria, q, maxPreco]);

  const hasFilters = !!categoria || !!q || maxPreco < 300;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">

        {/* Título + botão de filtros mobile */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Catálogo</p>
            <h1 className="font-display text-2xl md:text-4xl font-black mt-1 text-primary">
              {categoria ?? "Todos os produtos"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{filtered.length} produtos</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden gap-2 rounded-full"
            onClick={() => setShowFilters((s) => !s)}
          >
            {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            {showFilters ? "Fechar" : "Filtros"}
            {hasFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {/* Pills de categoria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <Link to="/produtos" search={{} as any}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${!categoria ? "bg-primary text-white" : "border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary"}`}>
            Todos
          </Link>
          {CATEGORIAS.map((c) => (
            <Link key={c} to="/produtos" search={{ categoria: c } as any}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${categoria === c ? "bg-primary text-white" : "border border-border bg-background text-foreground/80 hover:border-primary hover:text-primary"}`}>
              {c}
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-[240px,1fr] gap-6">

          {/* Sidebar filtros — sempre visível no desktop, colapsável no mobile */}
          <aside className={`space-y-4 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">Buscar</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    navigate({ search: (s: any) => ({ ...s, q: e.target.value || undefined }) });
                  }}
                  placeholder="Nome do produto..."
                  className="pl-9 bg-surface"
                />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">Preço máximo</h3>
              <Slider value={[maxPreco]} onValueChange={(v) => setMaxPreco(v[0])} min={10} max={300} step={10} />
              <p className="text-sm mt-3 font-bold text-primary">Até R$ {maxPreco}</p>
            </div>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full text-muted-foreground"
                onClick={() => {
                  setQ("");
                  setMaxPreco(300);
                  navigate({ search: {} as any });
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Limpar filtros
              </Button>
            )}
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center bg-surface">
                <p className="font-semibold text-muted-foreground">Nenhum produto encontrado.</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setQ(""); setMaxPreco(300); navigate({ search: {} as any }); }}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
