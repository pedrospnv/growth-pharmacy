import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart, Zap } from "lucide-react";
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
}

export function ProductCard({ p }: { p: Produto }) {
  const { add } = useCart();
  const disc = p.desconto ?? 0;
  const finalPrice = disc > 0 ? p.preco * (1 - disc / 100) : p.preco;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add({ id: p.id, nome: p.nome, preco: finalPrice, imagem_url: p.imagem_url });
    toast.success("Adicionado ao carrinho");
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elev transition-shadow"
    >
      <Link to="/produto/$id" params={{ id: p.id }} className="block">
        {disc > 0 && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
            <Zap className="h-3 w-3" /> -{disc}%
          </span>
        )}
        <div className="aspect-square overflow-hidden bg-gradient-soft">
          {p.imagem_url && (
            <img
              src={p.imagem_url}
              alt={p.nome}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
        </div>
        <div className="p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{p.categoria}</p>
          <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 min-h-10">{p.nome}</h3>
          <div className="flex items-baseline gap-2">
            {disc > 0 && <span className="text-xs line-through text-muted-foreground">{brl(p.preco)}</span>}
            <span className="font-display text-xl font-extrabold text-primary">{brl(finalPrice)}</span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Button onClick={handleAdd} className="w-full gap-2 rounded-full" size="sm">
          <ShoppingCart className="h-4 w-4" /> Adicionar
        </Button>
      </div>
    </motion.div>
  );
}
