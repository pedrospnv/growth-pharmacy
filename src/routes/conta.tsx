import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { maskCpf, maskCep, onlyDigits } from "@/lib/format";
import { User as UserIcon, LogOut, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/conta")({
  component: ContaPage,
});

type Aba = "informacoes" | "endereco";

function ContaPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<Aba>("informacoes");

  const [info, setInfo] = useState({ nome: "", cpf: "", email: "", telefone: "" });
  const [endereco, setEndereco] = useState({
    cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  });
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profile) return;
    setInfo({
      nome: profile.nome || "",
      cpf: profile.cpf ? maskCpf(profile.cpf) : "",
      email: user?.email || "",
      telefone: profile.telefone || "",
    });
    setEndereco({
      cep: profile.cep || "",
      rua: profile.rua || "",
      numero: profile.numero || "",
      complemento: profile.complemento || "",
      bairro: profile.bairro || "",
      cidade: profile.cidade || "",
      estado: profile.estado || "",
    });
  }, [profile, user]);

  const salvarInfo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: info.nome,
          cpf: onlyDigits(info.cpf),
          telefone: info.telefone,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informacoes salvas!");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: () => toast.error("Erro ao salvar informacoes"),
  });

  const salvarEndereco = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          cep: endereco.cep,
          rua: endereco.rua,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Endereco salvo!");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: () => toast.error("Erro ao salvar endereco"),
  });

  const buscarCep = async (cep: string) => {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setEndereco((e) => ({
          ...e,
          rua: data.logradouro || e.rua,
          bairro: data.bairro || e.bairro,
          cidade: data.localidade || e.cidade,
          estado: data.uf || e.estado,
        }));
      } else toast.error("CEP nao encontrado");
    } catch { toast.error("Falha ao buscar CEP"); }
    setCepLoading(false);
  };

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center">Carregando...</div>;
  }

  const abas: { id: Aba; label: string; icon: any }[] = [
    { id: "informacoes", label: "Minhas informacoes", icon: UserIcon },
    { id: "endereco", label: "Meu endereco", icon: MapPin },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl flex-1">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Minha conta</p>
            <h1 className="font-display text-4xl font-extrabold mt-1">
              Ola{profile?.nome ? `, ${profile.nome.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> {user.email}
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut().then(() => navigate({ to: "/" }))} className="gap-2 self-start sm:self-auto">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        <div className="flex gap-1 border-b border-border mb-8">
          {abas.map((a) => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
                aba === a.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <a.icon className="h-4 w-4" />
              {a.label}
            </button>
          ))}
        </div>

        {aba === "informacoes" && (
          <section className="rounded-2xl border border-border bg-card p-6 max-w-lg space-y-5">
            <h2 className="font-display text-xl font-bold">Minhas informacoes</h2>
            <div>
              <Label>Nome completo</Label>
              <Input value={info.nome} onChange={(e) => setInfo({ ...info, nome: e.target.value })} placeholder="Seu nome" />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={info.cpf} onChange={(e) => setInfo({ ...info, cpf: maskCpf(e.target.value) })} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={info.telefone} onChange={(e) => setInfo({ ...info, telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={info.email} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">O e-mail nao pode ser alterado aqui.</p>
            </div>
            <Button className="w-full rounded-full gap-2" disabled={salvarInfo.isPending} onClick={() => salvarInfo.mutate()}>
              {salvarInfo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar informacoes
            </Button>
          </section>
        )}

        {aba === "endereco" && (
          <section className="rounded-2xl border border-border bg-card p-6 max-w-lg space-y-5">
            <h2 className="font-display text-xl font-bold">Meu endereco</h2>
            <p className="text-sm text-muted-foreground">Salvo aqui, sera preenchido automaticamente no checkout.</p>
            <div>
              <Label>CEP</Label>
              <Input value={endereco.cep} onChange={(e) => {
                const v = e.target.value;
                setEndereco({ ...endereco, cep: v });
                if (onlyDigits(v).length === 8) buscarCep(v);
              }} placeholder="00000-000" />
              {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando endereco...</p>}
            </div>
            <div>
              <Label>Rua</Label>
              <Input value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Numero</Label><Input value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} /></div>
              <div><Label>Complemento</Label><Input value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} /></div>
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cidade</Label><Input value={endereco.cidade} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} /></div>
              <div><Label>Estado</Label><Input maxLength={2} value={endereco.estado} onChange={(e) => setEndereco({ ...endereco, estado: e.target.value.toUpperCase() })} /></div>
            </div>
            <Button className="w-full rounded-full gap-2" disabled={salvarEndereco.isPending} onClick={() => salvarEndereco.mutate()}>
              {salvarEndereco.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar endereco
            </Button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
