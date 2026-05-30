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
import { Search } from "lucide-react";

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

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco,categoria,imagem_url,desconto")
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 md:py-14 flex-1">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Catálogo</p>
          <h1 className="font-display text-3xl md:text-5xl font-black mt-2 text-primary">
            {categoria ?? "Todos os produtos"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{filtered.length} produtos encontrados</p>
        </div>

        {/* Pills filter */}
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

        <div className="grid lg:grid-cols-[260px,1fr] gap-8">
          <aside className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display font-bold mb-3 text-primary text-sm">Buscar</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); navigate({ search: (s: any) => ({ ...s, q: e.target.value || undefined }) }); }}
                  placeholder="Nome do produto..."
                  className="pl-9 bg-surface"
                />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display font-bold mb-3 text-primary text-sm">Preço máximo</h3>
              <Slider value={[maxPreco]} onValueChange={(v) => setMaxPreco(v[0])} min={10} max={300} step={10} />
              <p className="text-sm mt-3 font-bold text-primary">Até R$ {maxPreco}</p>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center bg-surface">
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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
