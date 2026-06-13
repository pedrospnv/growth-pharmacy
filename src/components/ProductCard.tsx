import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
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
    <div className={`group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-elev hover:-translate-y-0.5 ${semEstoque ? "opacity-60" : ""}`}>
      <Link to="/produto/$id" params={{ id: p.id }} className="flex flex-col flex-1">

        {/* Imagem */}
        <div className="relative aspect-square bg-surface overflow-hidden">
          {semEstoque && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-foreground">Indisponível</span>
            </div>
          )}
          {disc > 0 && !semEstoque && (
            <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
              -{disc}%
            </span>
          )}
          {p.imagem_url ? (
            <img
              src={p.imagem_url}
              alt={p.nome}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
              <ShoppingCart className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{p.categoria}</p>
          <h3 className="font-sans text-sm font-semibold leading-snug line-clamp-2 text-foreground min-h-10">{p.nome}</h3>
          <div className="mt-auto pt-1">
            {disc > 0 && !semEstoque && (
              <p className="text-[11px] line-through text-muted-foreground">{brl(p.preco)}</p>
            )}
            <p className="font-display text-base font-extrabold text-primary">
              {semEstoque ? "—" : brl(finalPrice)}
            </p>
          </div>
        </div>
      </Link>

      {/* Botão */}
      <div className="px-3 pb-3">
        <button
          onClick={handleAdd}
          disabled={semEstoque}
          className={`w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors
            ${semEstoque
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
            }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {semEstoque ? "Indisponível" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}
