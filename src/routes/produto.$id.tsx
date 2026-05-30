import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { ShoppingCart, Plus, Minus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$id")({
  component: ProdutoDetalhe,
});

function ProdutoDetalhe() {
  const { id } = Route.useParams();
  const [qtd, setQtd] = useState(1);
  const { add } = useCart();

  const { data: p, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center"><p>Carregando...</p></div>;
  if (!p) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto p-10 text-center flex-1">
        <p>Produto não encontrado.</p>
        <Button asChild className="mt-4"><Link to="/produtos">Voltar ao catálogo</Link></Button>
      </div>
      <Footer />
    </div>
  );

  const disc = p.desconto ?? 0;
  const finalPrice = disc > 0 ? Number(p.preco) * (1 - disc / 100) : Number(p.preco);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-1">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link> ·{" "}
          <Link to="/produtos" className="hover:text-primary">Produtos</Link> · <span>{p.categoria}</span>
        </nav>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="rounded-3xl overflow-hidden bg-surface border border-border shadow-card">
            {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="w-full aspect-square object-cover" />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">{p.categoria}</p>
            <h1 className="font-display text-4xl font-extrabold mt-2">{p.nome}</h1>
            {disc > 0 && <p className="text-sm line-through text-muted-foreground mt-4">{brl(Number(p.preco))}</p>}
            <div className="flex items-baseline gap-3 mt-1">
              <span className="font-display text-5xl font-extrabold text-primary">{brl(finalPrice)}</span>
              {disc > 0 && <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">-{disc}%</span>}
            </div>
            <p className="text-sm mt-2 text-muted-foreground">ou 3x de {brl(finalPrice / 3)} sem juros</p>

            <div className="mt-6 prose prose-sm max-w-none text-foreground/80">
              <p>{p.descricao}</p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border">
                <button onClick={() => setQtd(Math.max(1, qtd - 1))} className="grid place-items-center h-11 w-11 hover:bg-muted rounded-l-full"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-bold">{qtd}</span>
                <button onClick={() => setQtd(qtd + 1)} className="grid place-items-center h-11 w-11 hover:bg-muted rounded-r-full"><Plus className="h-4 w-4" /></button>
              </div>
              <Button
                size="lg"
                className="flex-1 rounded-full gap-2 h-12"
                onClick={() => {
                  add({ id: p.id, nome: p.nome, preco: finalPrice, imagem_url: p.imagem_url }, qtd);
                  toast.success("Adicionado ao carrinho");
                }}
              >
                <ShoppingCart className="h-5 w-5" /> Adicionar ao carrinho
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Truck className="h-5 w-5 text-primary" />
                <div><p className="text-xs font-bold">Entrega rápida</p><p className="text-xs text-muted-foreground">Em até 48h</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div><p className="text-xs font-bold">Compra segura</p><p className="text-xs text-muted-foreground">Loja certificada</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
