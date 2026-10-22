import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, ShieldCheck, Zap, ArrowRight, Pill, FlaskConical, Dumbbell, Leaf, Sparkles, Droplets } from "lucide-react";
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
        .select("id,nome,preco,categoria,imagem_url,desconto,destaque,estoque")
        .order("destaque", { ascending: false })
        .limit(8);
      return (data ?? []) as Produto[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* HERO — compacto, com card de oferta ao lado */}
      <section className="bg-primary text-white">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" /> 10% OFF no PIX
              </span>
              <h1 className="mt-5 font-display text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] text-balance">
                Sua farmácia,<br />agora <span className="text-amber">online</span>.
              </h1>
              <p className="mt-4 text-base text-white/70 max-w-md leading-relaxed">
                Medicamentos, manipulação e dermocosméticos com entrega expressa em todo o Brasil.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap">
                <Button asChild size="lg" className="rounded-full bg-amber text-primary hover:bg-amber/90 font-bold px-7 h-12 gap-2">
                  <Link to="/produtos">Comprar agora <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white px-7 h-12">
                  <Link to="/produtos" search={{ categoria: "Manipulação" } as any}>Ver manipulação</Link>
                </Button>
              </div>
            </div>

            {/* Cartão visual lateral — só desktop */}
            <div className="hidden md:block">
              <div className="rounded-3xl bg-white/5 backdrop-blur p-6 border border-white/10">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Truck, t: "Frete grátis", s: "Acima de R$ 199" },
                    { icon: Zap, t: "Entrega 48h", s: "Expressa" },
                    { icon: ShieldCheck, t: "100% seguro", s: "Certificado" },
                    { icon: Pill, t: "+2 mil itens", s: "No catálogo" },
                  ].map(({ icon: Icon, t, s }) => (
                    <div key={t} className="rounded-2xl bg-white/5 p-4">
                      <Icon className="h-5 w-5 text-amber mb-2" strokeWidth={1.75} />
                      <p className="text-sm font-bold text-white">{t}</p>
                      <p className="text-xs text-white/50">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR — mobile only, sutil */}
      <section className="border-b border-border md:hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { icon: Truck, t: "Frete grátis" },
              { icon: ShieldCheck, t: "Loja segura" },
              { icon: Zap, t: "Entrega 48h" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex flex-col items-center gap-1 py-3">
                <Icon className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-medium text-foreground/60">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-black text-primary">Categorias</h2>
          <Link to="/produtos" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORIAS.map(({ nome, icon: Icon }) => (
            <Link
              key={nome}
              to="/produtos"
              search={{ categoria: nome } as any}
              className="group flex flex-col items-center gap-3 py-6 px-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="text-xs font-semibold text-foreground text-center leading-tight">{nome}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="container mx-auto px-4 pb-12 md:pb-16 max-w-6xl">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl font-black text-primary">Mais vendidos</h2>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1">
            <Link to="/produtos">Ver catálogo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {produtos.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* BANNER OFERTAS — faixa simples e elegante */}
      <section className="container mx-auto px-4 pb-16 max-w-6xl">
        <div className="relative rounded-3xl bg-primary overflow-hidden px-8 py-12 md:px-14 md:py-16">
          {/* Detalhe decorativo sutil */}
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber/10 blur-2xl" />
          <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-amber/5 blur-xl" />
          <div className="relative max-w-lg">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-amber">Ofertas da semana</span>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white mt-3 leading-tight text-balance">
              Até 30% OFF em dermocosméticos
            </h2>
            <p className="mt-3 text-white/60 text-sm">
              Descontos exclusivos por tempo limitado. Aproveite enquanto durar o estoque.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-full bg-amber text-primary hover:bg-amber/90 font-bold gap-2">
              <Link to="/produtos" search={{ categoria: "Dermocosméticos" } as any}>
                Ver ofertas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
