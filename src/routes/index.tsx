import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, Clock, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Produto } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BioFarma — Sua farmácia online com 10% OFF no PIX" },
      { name: "description", content: "Medicamentos, vitaminas e dermocosméticos com entrega rápida e o melhor preço." },
    ],
  }),
  component: Home,
});

const CATEGORIAS = [
  { nome: "Medicamentos", emoji: "💊", cor: "from-emerald-500/20 to-emerald-700/10" },
  { nome: "Vitaminas", emoji: "🍊", cor: "from-amber-400/20 to-orange-500/10" },
  { nome: "Higiene Pessoal", emoji: "🧴", cor: "from-sky-400/20 to-blue-500/10" },
  { nome: "Dermocosméticos", emoji: "✨", cor: "from-pink-400/20 to-rose-500/10" },
  { nome: "Suplementos", emoji: "💪", cor: "from-violet-400/20 to-fuchsia-500/10" },
];

function Home() {
  const { data: produtos = [] } = useQuery({
    queryKey: ["home-produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco,categoria,imagem_url,desconto,destaque")
        .order("destaque", { ascending: false })
        .limit(8);
      return (data ?? []) as Produto[];
    },
  });

  const { data: ofertas = [] } = useQuery({
    queryKey: ["home-ofertas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco,categoria,imagem_url,desconto")
        .gt("desconto", 0)
        .order("desconto", { ascending: false })
        .limit(4);
      return (data ?? []) as Produto[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_30%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_35%)]" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Nova coleção de cuidados diários
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-extrabold leading-[1.05] text-balance">
              Sua saúde merece o<br />
              <span className="text-warning">melhor cuidado</span>
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/85 max-w-lg">
              Medicamentos, vitaminas e dermocosméticos com entrega expressa e <strong>10% OFF</strong> pagando no PIX.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-bold">
                <Link to="/produtos">Comprar agora <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/produtos" search={{ categoria: "Dermocosméticos" } as any}>Ver ofertas</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { icon: Truck, t: "Frete grátis", s: "Acima de R$ 199" },
                { icon: ShieldCheck, t: "Seguro", s: "Loja certificada" },
                { icon: Clock, t: "Entrega", s: "Em até 48h" },
              ].map(({ icon: Icon, t, s }) => (
                <div key={t} className="text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1.5" />
                  <p className="text-xs font-bold">{t}</p>
                  <p className="text-[10px] text-primary-foreground/70">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative hidden md:block"
          >
            <div className="absolute -inset-10 bg-white/10 rounded-[3rem] blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600" className="rounded-3xl aspect-[3/4] object-cover shadow-elev" alt="vitaminas" />
              <img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600" className="rounded-3xl aspect-[3/4] object-cover shadow-elev mt-10" alt="cuidados" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Explore</p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mt-1">Categorias</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIAS.map((c, i) => (
            <motion.div
              key={c.nome}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to="/produtos"
                search={{ categoria: c.nome } as any}
                className={`block rounded-2xl border border-border bg-gradient-to-br ${c.cor} p-6 hover:shadow-elev transition-all hover:-translate-y-1`}
              >
                <div className="text-4xl mb-3">{c.emoji}</div>
                <p className="font-display font-bold">{c.nome}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Ver tudo <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Top vendas</p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold mt-1">Mais vendidos</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/produtos">Ver catálogo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {produtos.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* OFERTAS BANNER */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl bg-gradient-accent text-primary-foreground p-8 md:p-14 grid md:grid-cols-2 gap-8 items-center shadow-elev relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-90">Ofertas do dia</p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold mt-2 text-balance">
              Até 30% OFF em<br />dermocosméticos
            </h2>
            <p className="mt-4 opacity-90">Aproveite descontos exclusivos por tempo limitado.</p>
            <Button asChild size="lg" className="mt-6 rounded-full bg-white text-primary hover:bg-white/90 font-bold">
              <Link to="/produtos">Aproveitar</Link>
            </Button>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {ofertas.slice(0, 4).map((p) => (
              <Link key={p.id} to="/produto/$id" params={{ id: p.id }}
                className="rounded-2xl bg-white/95 p-3 text-foreground hover:scale-105 transition-transform">
                {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="aspect-square w-full object-cover rounded-xl" />}
                <p className="text-xs font-semibold mt-2 line-clamp-1">{p.nome}</p>
                <p className="text-primary font-bold text-sm">-{p.desconto}%</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
