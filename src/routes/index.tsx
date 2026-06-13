import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, ShieldCheck, Zap, ArrowRight, ArrowUpRight, Pill, FlaskConical, Dumbbell, Leaf, Sparkles, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Produto } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";

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

  const { data: ofertas = [] } = useQuery({
    queryKey: ["home-ofertas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id,nome,preco,categoria,imagem_url,desconto,estoque")
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
        <div className="container mx-auto px-4 py-14 md:py-24 max-w-5xl text-center">
          <span className="inline-block rounded-full bg-amber px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            10% OFF pagando no PIX
          </span>
          <h1 className="mt-5 font-display text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] text-balance">
            Sua farmácia,<br />agora <span className="text-amber">online</span>.
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            Medicamentos, manipulação e dermocosméticos com entrega expressa e 10% OFF no PIX.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap justify-center">
            <Button asChild size="lg" className="rounded-full bg-amber text-primary hover:bg-amber/90 font-bold px-8 h-12 gap-2">
              <Link to="/produtos">Comprar agora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white px-8 h-12">
              <Link to="/produtos" search={{ categoria: "Manipulação" } as any}>Ver manipulação</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TRUST BAR — linha fina, sem cards */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { icon: Truck, t: "Frete grátis acima de R$ 199" },
              { icon: ShieldCheck, t: "Farmácia certificada e segura" },
              { icon: Zap, t: "Entrega em até 48h" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-center justify-center gap-2.5 py-4 px-3">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs font-medium text-foreground/70 hidden sm:block">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS — lista horizontal com separadores */}
      <section className="container mx-auto px-4 py-14 max-w-6xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Explore</p>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mt-1 text-primary">Categorias</h2>
          </div>
          <Link to="/produtos" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            Ver tudo <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {CATEGORIAS.map(({ nome, icon: Icon }) => (
            <Link
              key={nome}
              to="/produtos"
              search={{ categoria: nome } as any}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-surface hover:bg-primary transition-colors"
            >
              <Icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" strokeWidth={1.5} />
              <p className="text-xs font-semibold text-primary group-hover:text-white transition-colors text-center leading-tight">{nome}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="container mx-auto px-4 pb-14 max-w-6xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Destaques</p>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mt-1 text-primary">Mais vendidos</h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-primary gap-1">
            <Link to="/produtos">Ver catálogo <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {produtos.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <div className="mt-6 flex justify-center sm:hidden">
          <Button asChild variant="outline" className="rounded-full gap-2">
            <Link to="/produtos">Ver todos os produtos <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* BANNER OFERTAS — editorial, dois painéis */}
      {ofertas.length > 0 && (
        <section className="container mx-auto px-4 pb-16 max-w-6xl">
          <div className="rounded-3xl bg-primary overflow-hidden grid md:grid-cols-[1fr,1fr]">
            {/* Texto */}
            <div className="p-8 md:p-12 flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber">Ofertas da semana</span>
                <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white mt-3 leading-[1.05]">
                  Até<br /><span className="text-amber">30% OFF</span><br />em cosméticos
                </h2>
                <p className="mt-4 text-sm text-white/50 max-w-xs">
                  Descontos exclusivos por tempo limitado em dermocosméticos selecionados.
                </p>
              </div>
              <Button asChild size="lg" className="mt-8 w-fit rounded-full bg-amber text-primary hover:bg-amber/90 font-bold gap-2">
                <Link to="/produtos">Aproveitar <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Grid de produtos */}
            <div className="grid grid-cols-2 gap-px bg-white/10 border-t md:border-t-0 md:border-l border-white/10">
              {ofertas.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to="/produto/$id"
                  params={{ id: p.id }}
                  className="bg-primary p-4 hover:bg-white/5 transition-colors flex flex-col gap-2"
                >
                  {p.imagem_url && (
                    <div className="aspect-square rounded-xl overflow-hidden bg-white/10">
                      <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-white/80 line-clamp-1">{p.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-amber font-bold text-sm">-{p.desconto}%</span>
                      <span className="text-white/50 text-xs">{brl(p.preco * (1 - (p.desconto ?? 0) / 100))}</span>
                    </div>
                  </div>
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
