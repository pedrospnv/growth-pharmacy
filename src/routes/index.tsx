import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Truck, ShieldCheck, Clock, ArrowRight, Pill, FlaskConical, Dumbbell, Leaf, Sparkles, Droplets,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Produto } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farma Pro — Sua farmácia online com 10% OFF no PIX" },
      { name: "description", content: "Medicamentos, manipulação, vitaminas e dermocosméticos com entrega rápida e o melhor preço." },
    ],
  }),
  component: Home,
});

const CATEGORIAS = [
  { nome: "Medicamentos", icon: Pill },
  { nome: "Manipulação", icon: FlaskConical },
  { nome: "Suplementos", icon: Dumbbell },
  { nome: "Vitaminas", icon: Leaf },
  { nome: "Higiene Pessoal", icon: Droplets },
  { nome: "Dermocosméticos", icon: Sparkles },
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* HERO */}
      <section className="bg-primary text-white">
        <div className="container mx-auto px-4 py-12 md:py-24 max-w-5xl text-center">
          <span className="inline-block rounded-full bg-amber px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            10% OFF pagando no PIX
          </span>
          <h1 className="mt-4 font-display text-3xl md:text-6xl lg:text-7xl font-black leading-[1.05] text-balance">
            Sua farmácia,<br />agora <span className="text-amber">profissional</span>.
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/75 max-w-2xl mx-auto">
            Medicamentos, manipulação, suplementos e dermocosméticos com entrega expressa e atendimento farmacêutico especializado.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap justify-center">
            <Button asChild size="lg" className="rounded-lg bg-amber text-primary hover:bg-amber/90 font-bold px-8 h-12">
              <Link to="/produtos">Comprar agora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-lg border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white px-8 h-12">
              <Link to="/produtos" search={{ categoria: "Manipulação" } as any}>Manipulação</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6 grid grid-cols-3 gap-4 max-w-4xl">
          {[
            { icon: Truck, t: "Frete grátis", s: "Acima de R$ 199" },
            { icon: ShieldCheck, t: "Loja segura", s: "Farmácia certificada" },
            { icon: Clock, t: "Entrega rápida", s: "Em até 48h" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3 justify-center text-center md:text-left">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-primary leading-tight">{t}</p>
                <p className="text-xs text-muted-foreground">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Explore</p>
          <h2 className="font-display text-3xl md:text-4xl font-black mt-2 text-primary">Categorias</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {CATEGORIAS.map(({ nome, icon: Icon }) => (
            <Link
              key={nome}
              to="/produtos"
              search={{ categoria: nome } as any}
              className="group flex flex-col items-center justify-center gap-3 p-4 md:p-6 rounded-xl bg-surface border border-border hover:border-primary hover:shadow-card transition-all"
            >
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <p className="text-[11px] md:text-sm font-semibold text-primary text-center leading-tight break-words w-full">{nome}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Top vendas</p>
            <h2 className="font-display text-3xl md:text-4xl font-black mt-2 text-primary">Mais vendidos</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex text-primary">
            <Link to="/produtos">Ver catálogo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {produtos.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* OFERTAS BANNER */}
      {ofertas.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="rounded-2xl bg-primary text-white p-6 md:p-12 grid md:grid-cols-2 gap-8 items-center overflow-hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-amber">Ofertas da semana</p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-black mt-3 text-balance leading-tight">
                Até 30% OFF em<br />dermocosméticos
              </h2>
              <p className="mt-4 text-white/75">Descontos exclusivos por tempo limitado.</p>
              <Button asChild size="lg" className="mt-6 rounded-lg bg-amber text-primary hover:bg-amber/90 font-bold">
                <Link to="/produtos">Aproveitar</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ofertas.slice(0, 4).map((p) => (
                <Link key={p.id} to="/produto/$id" params={{ id: p.id }}
                  className="rounded-xl bg-white p-3 text-foreground hover:scale-[1.02] transition-transform">
                  {p.imagem_url && <img src={p.imagem_url} alt={p.nome} className="aspect-square w-full object-cover rounded-lg bg-surface" />}
                  <p className="text-xs font-semibold mt-2 line-clamp-1 text-primary">{p.nome}</p>
                  <p className="text-primary font-black text-sm">-{p.desconto}%</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
