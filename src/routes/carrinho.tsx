import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Farma Pro" }] }),
  component: Carrinho,
});

function Carrinho() {
  const { items, remove, setQty, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1 max-w-5xl">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-6">Seu Carrinho</h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-display font-bold">Carrinho vazio</p>
            <p className="text-muted-foreground mt-2 text-sm">Adicione produtos para começar.</p>
            <Button asChild className="mt-6 rounded-full"><Link to="/produtos">Ver catálogo</Link></Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,340px] gap-6">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 md:p-4 items-center">
                  {i.imagem_url && (
                    <img src={i.imagem_url} alt={i.nome} className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base line-clamp-2 leading-snug">{i.nome}</p>
                    <p className="text-primary font-bold text-sm mt-1">{brl(i.preco)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center rounded-full border border-border">
                      <button onClick={() => setQty(i.id, i.quantidade - 1)} className="grid h-8 w-8 place-items-center hover:bg-muted rounded-l-full transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{i.quantidade}</span>
                      <button onClick={() => setQty(i.id, i.quantidade + 1)} className="grid h-8 w-8 place-items-center hover:bg-muted rounded-r-full transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">{brl(i.preco * i.quantidade)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo — fica embaixo no mobile, lateral no desktop */}
            <aside className="rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-32">
              <h3 className="font-display text-lg font-bold mb-4">Resumo do pedido</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantidade, 0)} itens)</span>
                  <span className="font-semibold">{brl(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-muted-foreground text-xs">calculado no checkout</span>
                </div>
                <div className="flex justify-between text-green-600 text-xs">
                  <span>10% OFF no PIX</span>
                  <span>-{brl(subtotal * 0.1)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-border pt-4 mb-5">
                <span className="font-bold">Total estimado</span>
                <span className="font-display font-extrabold text-xl text-primary">{brl(subtotal)}</span>
              </div>
              <Button onClick={() => navigate({ to: "/checkout" })} size="lg" className="w-full rounded-full gap-2 h-12">
                Finalizar compra <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground">
                <Link to="/produtos">Continuar comprando</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
