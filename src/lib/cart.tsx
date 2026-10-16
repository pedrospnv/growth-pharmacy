import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  nome: string;
  preco: number;
  imagem_url: string | null;
  quantidade: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantidade">, qtd?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qtd: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartCtx | null>(null);
const STORAGE = "farmapro_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCart = async () => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE) : null;
        const saved = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(saved) || saved.length === 0) return;
        const ids = saved.map((item: CartItem) => item?.id).filter((id: unknown): id is string => typeof id === "string");
        if (!ids.length) return;
        const { data, error } = await supabase.from("produtos")
          .select("id,nome,preco,imagem_url,estoque").in("id", ids);
        if (cancelled) return;
        if (!error && data) {
          const products = new Map(data.map((product) => [product.id, product]));
          setItems(saved.flatMap((item: CartItem) => {
            const product = products.get(item.id);
            if (!product || product.estoque <= 0) return [];
            return [{
              id: product.id,
              nome: product.nome,
              preco: Number(product.preco),
              imagem_url: product.imagem_url,
              quantidade: Math.max(1, Math.min(Number(item.quantidade) || 1, product.estoque)),
            }];
          }));
        } else {
          setItems(saved);
        }
      } catch {
        // Mantém o carrinho utilizável se a validação remota estiver indisponível.
      } finally {
        if (!cancelled) setCartReady(true);
      }
    };
    void loadCart();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (cartReady && typeof window !== "undefined") {
      localStorage.setItem(STORAGE, JSON.stringify(items));
    }
  }, [items, cartReady]);

  const add: CartCtx["add"] = (item, qtd = 1) => {
    setItems((prev) => {
      const ex = prev.find((p) => p.id === item.id);
      if (ex) return prev.map((p) => p.id === item.id ? { ...p, quantidade: p.quantidade + qtd } : p);
      return [...prev, { ...item, quantidade: qtd }];
    });
  };
  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const setQty = (id: string, qtd: number) =>
    setItems((p) => p.map((i) => i.id === id ? { ...i, quantidade: Math.max(1, qtd) } : i));
  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const count = items.reduce((s, i) => s + i.quantidade, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fora do provider");
  return ctx;
};
