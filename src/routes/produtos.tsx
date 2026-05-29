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

const CATEGORIAS = ["Medicamentos", "Vitaminas", "Higiene Pessoal", "Dermocosméticos", "Suplementos"];

export const Route = createFileRoute("/produtos")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Catálogo — BioFarma" }, { name: "description", content: "Catálogo completo BioFarma." }] }),
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
      <div className="container mx-auto px-4 py-10 flex-1">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Catálogo</p>
          <h1 className="font-display text-4xl font-extrabold mt-1">
            {categoria ?? "Todos os produtos"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{filtered.length} produtos encontrados</p>
        </div>

        <div className="grid lg:grid-cols-[260px,1fr] gap-8">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold mb-3">Buscar</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); navigate({ search: (s: any) => ({ ...s, q: e.target.value || undefined }) }); }}
                  placeholder="Nome do produto..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold mb-3">Categorias</h3>
              <div className="space-y-1">
                <Link to="/produtos" search={{} as any} className={`block px-3 py-2 rounded-lg text-sm ${!categoria ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>Todas</Link>
                {CATEGORIAS.map((c) => (
                  <Link key={c} to="/produtos" search={{ categoria: c } as any}
                    className={`block px-3 py-2 rounded-lg text-sm ${categoria === c ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>{c}</Link>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display font-bold mb-3">Preço máximo</h3>
              <Slider value={[maxPreco]} onValueChange={(v) => setMaxPreco(v[0])} min={10} max={300} step={10} />
              <p className="text-sm mt-3 font-semibold text-primary">Até R$ {maxPreco}</p>
            </div>
          </aside>

          <div>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
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
