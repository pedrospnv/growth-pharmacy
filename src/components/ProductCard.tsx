import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem_url: string | null;
  desconto?: number | null;
  destaque?: boolean | null;
  estoque?: number;
}

export function ProductCard({ p }: { p: Produto }) {
  const { add } = useCart();
  const disc = p.desconto ?? 0;
  const finalPrice = disc > 0 ? p.preco * (1 - disc / 100) : p.preco;
  const semEstoque = (p.estoque ?? 1) <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (semEstoque) return;
    add({ id: p.id, nome: p.nome, preco: finalPrice, imagem_url: p.imagem_url });
    toast.success("Adicionado ao carrinho");
  };

  return (
    <div className={`group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-elev ${semEstoque ? "opacity-60" : ""}`}>
      <Link to="/produto/$id" params={{ id: p.id }} className="flex flex-col flex-1">
        <div className="relative aspect-square bg-surface overflow-hidden">
          {semEstoque && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <span className="rounded-md bg-white/90 px-3 py-1 text-xs font-bold text-foreground">Indisponível</span>
            </div>
          )}
          {!semEstoque && disc > 0 && (
            <span className="absolute top-3 left-3 z-10 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
              -{disc}%
            </span>
          )}
          {!semEstoque && p.destaque && (
            <span className="absolute top-3 right-3 z-10 rounded-md bg-amber px-2 py-0.5 text-[11px] font-bold text-primary">
              Novo
            </span>
          )}
          {p.imagem_url && (
            <img
              src={p.imagem_url}
              alt={p.nome}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">{p.categoria}</p>
          <h3 className="font-display text-sm font-semibold leading-snug line-clamp-2 text-primary min-h-10">{p.nome}</h3>
          <div className="mt-auto flex flex-col leading-tight">
            {disc > 0 && !semEstoque && (
              <span className="text-[11px] line-through text-muted-foreground">{brl(p.preco)}</span>
            )}
            <span className="font-display text-base md:text-xl font-extrabold text-primary break-words">
              {semEstoque ? "Indisponível" : brl(finalPrice)}
            </span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Button
          onClick={handleAdd}
          disabled={semEstoque}
          className="w-full h-10 gap-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4" />
          {semEstoque ? "Indisponível" : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}
