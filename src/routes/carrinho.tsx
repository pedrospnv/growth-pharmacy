import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — BioFarma" }] }),
  component: Carrinho,
});

function Carrinho() {
  const { items, remove, setQty, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-1">
        <h1 className="font-display text-4xl font-extrabold mb-8">Seu Carrinho</h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-display font-bold">Carrinho vazio</p>
            <p className="text-muted-foreground mt-2">Adicione produtos para começar.</p>
            <Button asChild className="mt-6 rounded-full"><Link to="/produtos">Ver catálogo</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,360px] gap-8">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 items-center">
                  {i.imagem_url && <img src={i.imagem_url} alt={i.nome} className="h-20 w-20 rounded-xl object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold line-clamp-2">{i.nome}</p>
                    <p className="text-primary font-bold mt-1">{brl(i.preco)}</p>
                  </div>
                  <div className="flex items-center rounded-full border border-border">
                    <button onClick={() => setQty(i.id, i.quantidade - 1)} className="grid h-9 w-9 place-items-center hover:bg-muted rounded-l-full"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm font-bold">{i.quantidade}</span>
                    <button onClick={() => setQty(i.id, i.quantidade + 1)} className="grid h-9 w-9 place-items-center hover:bg-muted rounded-r-full"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive p-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <aside className="rounded-2xl border border-border bg-card p-6 h-fit sticky top-32 shadow-card">
              <h3 className="font-display text-xl font-bold mb-4">Resumo</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{brl(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-muted-foreground">calculado no checkout</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4 mb-6">
                <span className="font-bold">Total estimado</span>
                <span className="font-display font-extrabold text-2xl text-primary">{brl(subtotal)}</span>
              </div>
              <Button onClick={() => navigate({ to: "/checkout" })} size="lg" className="w-full rounded-full gap-2">
                Finalizar Compra <ArrowRight className="h-4 w-4" />
              </Button>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
