import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Package, ShoppingBag, Users, UserCog, Ban, Check } from "lucide-react";
import {
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
  setAccountActive,
  listFuncionarios,
  listClientes,
} from "@/lib/staff.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Farma Pro" }] }),
  component: Admin,
});

type Produto = {
  id: string; nome: string; descricao: string | null; preco: number;
  categoria: string; imagem_url: string | null; estoque: number; desconto: number | null;
};

function Admin() {
  const { user, isAdmin, isFuncionario, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin && !isFuncionario) { toast.error("Acesso restrito"); navigate({ to: "/" }); }
  }, [user, isAdmin, isFuncionario, loading, navigate]);

  if (loading || (!isAdmin && !isFuncionario)) return <div className="min-h-screen grid place-items-center">Verificando acesso...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-1">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Painel</p>
          <h1 className="font-display text-4xl font-extrabold mt-1">
            Admin Farma Pro {isFuncionario && !isAdmin && <span className="text-sm font-normal text-muted-foreground">(funcionário)</span>}
          </h1>
        </div>
        <Tabs defaultValue="produtos">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="produtos"><Package className="h-4 w-4 mr-2" />Produtos</TabsTrigger>
            <TabsTrigger value="pedidos"><ShoppingBag className="h-4 w-4 mr-2" />Pedidos</TabsTrigger>
            {isAdmin && <TabsTrigger value="equipe"><UserCog className="h-4 w-4 mr-2" />Equipe</TabsTrigger>}
            {isAdmin && <TabsTrigger value="clientes"><Users className="h-4 w-4 mr-2" />Clientes</TabsTrigger>}
          </TabsList>
          <TabsContent value="produtos" className="mt-6"><ProdutosAdmin /></TabsContent>
          <TabsContent value="pedidos" className="mt-6"><PedidosAdmin /></TabsContent>
          {isAdmin && <TabsContent value="equipe" className="mt-6"><EquipeAdmin /></TabsContent>}
          {isAdmin && <TabsContent value="clientes" className="mt-6"><ClientesAdmin /></TabsContent>}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

const emptyForm: Omit<Produto, "id"> = {
  nome: "", descricao: "", preco: 0, categoria: "Medicamentos", imagem_url: "", estoque: 0, desconto: 0,
};

function ProdutosAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: produtos = [] } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*").order("nome");
      return (data ?? []) as Produto[];
    },
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Produto) => {
    setEditing(p);
    setForm({ ...p, descricao: p.descricao ?? "", imagem_url: p.imagem_url ?? "", desconto: p.desconto ?? 0 });
    setOpen(true);
  };

  const save = async () => {
    const payload = { ...form, preco: Number(form.preco), estoque: Number(form.estoque), desconto: Number(form.desconto) };
    const op = editing
      ? supabase.from("produtos").update(payload).eq("id", editing.id)
      : supabase.from("produtos").insert(payload);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Produto atualizado" : "Produto criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-produtos"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído");
    qc.invalidateQueries({ queryKey: ["admin-produtos"] });
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-muted-foreground">{produtos.length} produtos</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} produto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} /></div>
                <div><Label>Estoque</Label><Input type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) })} /></div>
                <div><Label>Categoria</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                    {["Medicamentos","Manipulação","Vitaminas","Higiene Pessoal","Dermocosméticos","Suplementos"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Desconto (%)</Label><Input type="number" value={form.desconto ?? 0} onChange={(e) => setForm({ ...form, desconto: Number(e.target.value) })} /></div>
              </div>
              <div><Label>URL da imagem</Label><Input value={form.imagem_url ?? ""} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} /></div>
              <Button onClick={save} className="w-full">{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {produtos.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 flex gap-3">
            {p.imagem_url && <img src={p.imagem_url} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">{p.nome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.categoria}</p>
              <p className="text-sm font-bold text-primary mt-1">{brl(Number(p.preco))}</p>
              <p className="text-xs text-muted-foreground">Estoque: {p.estoque}</p>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="h-8 w-8 p-0 rounded-lg"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" onClick={() => remove(p.id)} className="h-8 w-8 p-0 rounded-lg border-destructive"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3"></th></tr></thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 flex items-center gap-3">{p.imagem_url && <img src={p.imagem_url} alt="" className="h-10 w-10 rounded object-cover" />}<span className="font-medium">{p.nome}</span></td>
                <td className="p-3 text-muted-foreground">{p.categoria}</td>
                <td className="p-3 font-semibold">{brl(Number(p.preco))}</td>
                <td className="p-3">{p.estoque}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_PAGOS = ["pago", "em_preparacao", "a_caminho", "entregue", "cancelado"] as const;
const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  processando: "Processando",
  em_preparacao: "Em preparação",
  enviado: "Enviado",
  a_caminho: "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function PedidosAdmin() {
  const qc = useQueryClient();
  const { data: pedidos = [] } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("*").order("criado_em", { ascending: false });
      return data ?? [];
    },
  });

  const PENDING = ["pendente", "aguardando_pagamento", "aguardando_pix", "aguardando_boleto"];
  const aguardando = pedidos.filter((p: any) => PENDING.includes(p.status));
  const pagos = pedidos.filter((p: any) => !PENDING.includes(p.status));

  const exportar = () => {
    const rows = pedidos.map((p: any) => ({
      Data: new Date(p.criado_em).toLocaleString("pt-BR"),
      Nome: p.nome_cliente, "E-mail": p.email, CEP: p.cep, Endereço: p.endereco,
      Cidade: p.cidade, Estado: p.estado,
      Itens: (p.itens as any[]).map((i) => `${i.quantidade}× ${i.nome}`).join(" | "),
      Subtotal: Number(p.subtotal), Frete: Number(p.frete),
      "Desconto PIX": Number(p.desconto_pix), Total: Number(p.total),
      "Forma de Pagamento": p.forma_pagamento,
      Status: STATUS_LABELS[p.status] ?? p.status,
      "Código de Rastreio": (p as any).codigo_rastreio ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `farmapro-pedidos-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const marcarPago = async (id: string) => {
    const { error } = await supabase.from("pedidos").update({ status: "pago" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido marcado como pago");
    qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
  };

  return (
    <div>
      <div className="flex justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{pedidos.length} pedidos no total</p>
        <Button onClick={exportar} className="rounded-full gap-2"><Download className="h-4 w-4" /> Exportar (.xlsx)</Button>
      </div>

      <Tabs defaultValue="aguardando">
        <TabsList>
          <TabsTrigger value="aguardando">Aguardando pagamento ({aguardando.length})</TabsTrigger>
          <TabsTrigger value="pagos">Pagos ({pagos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="aguardando" className="mt-4">
          {aguardando.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido aguardando pagamento.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {aguardando.map((p: any) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{p.nome_cliente}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(p.criado_em).toLocaleString("pt-BR")} · {(p.itens as any[]).length} itens · {p.cidade}/{p.estado}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-primary">{brl(Number(p.total))}</div>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">{p.forma_pagamento}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => marcarPago(p.id)} className="rounded-full gap-2">
                    <Check className="h-3.5 w-3.5" /> Marcar como pago
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido pago.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {pagos.map((p: any) => (
                <PedidoPagoCard key={p.id} pedido={p} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PedidoPagoCard({ pedido }: { pedido: any }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>(pedido.status);
  const [rastreio, setRastreio] = useState<string>(pedido.codigo_rastreio ?? "");
  const [saving, setSaving] = useState(false);

  const updateStatus = async (novo: string) => {
    setStatus(novo);
    const { error } = await supabase.from("pedidos").update({ status: novo }).eq("id", pedido.id);
    if (error) { toast.error(error.message); setStatus(pedido.status); return; }
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
  };

  const saveRastreio = async () => {
    setSaving(true);
    const { error } = await supabase.from("pedidos").update({ codigo_rastreio: rastreio.trim() || null } as any).eq("id", pedido.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Código de rastreio salvo");
    qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-sm">{pedido.nome_cliente}</p>
          <p className="text-xs text-muted-foreground">{pedido.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            #{pedido.id.slice(0, 8).toUpperCase()} · {new Date(pedido.criado_em).toLocaleString("pt-BR")} · {(pedido.itens as any[]).length} itens · {pedido.cidade}/{pedido.estado}
          </p>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-primary">{brl(Number(pedido.total))}</div>
          <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">{pedido.forma_pagamento}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border">
        <div>
          <Label className="text-xs">Status</Label>
          <select
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => updateStatus(e.target.value)}
          >
            {STATUS_PAGOS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Código de rastreio</Label>
          <div className="flex gap-2 mt-1">
            <Input value={rastreio} onChange={(e) => setRastreio(e.target.value)} placeholder="Ex.: BR123456789BR" className="h-9" />
            <Button size="sm" onClick={saveRastreio} disabled={saving} className="h-9">Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipeAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(listFuncionarios);
  const create = useServerFn(createFuncionario);
  const update = useServerFn(updateFuncionario);
  const del = useServerFn(deleteFuncionario);
  const setActive = useServerFn(setAccountActive);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; nome: string | null; email: string | null } | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-funcionarios"],
    queryFn: () => list(),
  });
  const funcionarios = data?.funcionarios ?? [];

  const openNew = () => { setEditing(null); setForm({ nome: "", email: "", senha: "" }); setOpen(true); };
  const openEdit = (f: any) => { setEditing(f); setForm({ nome: f.nome ?? "", email: f.email ?? "", senha: "" }); setOpen(true); };

  const save = async () => {
    try {
      if (editing) {
        await update({ data: { id: editing.id, nome: form.nome, senha: form.senha || undefined } });
        toast.success("Funcionário atualizado");
      } else {
        if (!form.senha || form.senha.length < 6) { toast.error("Senha deve ter 6+ caracteres"); return; }
        await create({ data: { nome: form.nome, email: form.email, senha: form.senha } });
        toast.success("Funcionário criado");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-funcionarios"] });
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  };

  const toggle = async (id: string, ativo: boolean) => {
    try {
      await setActive({ data: { id, ativo: !ativo } });
      toast.success(ativo ? "Conta desativada" : "Conta reativada");
      qc.invalidateQueries({ queryKey: ["admin-funcionarios"] });
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir funcionário definitivamente?")) return;
    try {
      await del({ data: { id } });
      toast.success("Excluído");
      qc.invalidateQueries({ queryKey: ["admin-funcionarios"] });
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-muted-foreground">{funcionarios.length} funcionários</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="rounded-full gap-2"><Plus className="h-4 w-4" /> Novo funcionário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar funcionário" : "Cadastrar funcionário"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label>{editing ? "Nova senha (opcional)" : "Senha temporária"}</Label>
                <Input type="text" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
              </div>
              <Button onClick={save} className="w-full">{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th></tr></thead>
            <tbody>
              {funcionarios.map((f: { id: string; nome: string | null; email: string | null; ativo: boolean }) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="p-3 font-medium">{f.nome ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{f.email}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${f.ativo ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {f.ativo ? "Ativo" : "Suspenso"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toggle(f.id, f.ativo)}>
                      {f.ativo ? <Ban className="h-4 w-4 text-destructive" /> : <Check className="h-4 w-4 text-primary" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {!funcionarios.length && <tr><td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">Nenhum funcionário cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClientesAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(listClientes);
  const setActive = useServerFn(setAccountActive);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: () => list(),
  });
  const clientes = data?.clientes ?? [];

  const toggle = async (id: string, ativo: boolean) => {
    try {
      await setActive({ data: { id, ativo: !ativo } });
      toast.success(ativo ? "Cliente desativado" : "Cliente reativado");
      qc.invalidateQueries({ queryKey: ["admin-clientes"] });
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{clientes.length} clientes</p>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr className="text-left"><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Cadastro</th><th className="p-3">Pedidos</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th></tr></thead>
            <tbody>
              {clientes.map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-medium">{c.nome ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.email}</td>
                  <td className="p-3 text-xs">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 font-semibold">{c.pedidos_count}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.ativo ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {c.ativo ? "Ativo" : "Suspenso"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toggle(c.id, c.ativo)}>
                      {c.ativo ? <Ban className="h-4 w-4 text-destructive" /> : <Check className="h-4 w-4 text-primary" />}
                    </Button>
                  </td>
                </tr>
              ))}
              {!clientes.length && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
