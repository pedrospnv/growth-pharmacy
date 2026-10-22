import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE, JSON.stringify(items));
    }
  }, [items]);

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
