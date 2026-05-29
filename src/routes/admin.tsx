import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Pencil, Trash2, Download, Package, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — BioFarma" }] }),
  component: Admin,
});

type Produto = {
  id: string; nome: string; descricao: string | null; preco: number;
  categoria: string; imagem_url: string | null; estoque: number; desconto: number | null;
};

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) { toast.error("Acesso restrito a administradores"); navigate({ to: "/" }); }
  }, [user, isAdmin, loading, navigate]);

  if (loading || !isAdmin) return <div className="min-h-screen grid place-items-center">Verificando acesso...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-10 flex-1">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Painel</p>
          <h1 className="font-display text-4xl font-extrabold mt-1">Admin BioFarma</h1>
        </div>
        <Tabs defaultValue="produtos">
          <TabsList>
            <TabsTrigger value="produtos"><Package className="h-4 w-4 mr-2" />Produtos</TabsTrigger>
            <TabsTrigger value="pedidos"><ShoppingBag className="h-4 w-4 mr-2" />Pedidos</TabsTrigger>
          </TabsList>
          <TabsContent value="produtos" className="mt-6"><ProdutosAdmin /></TabsContent>
          <TabsContent value="pedidos" className="mt-6"><PedidosAdmin /></TabsContent>
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
          <DialogTrigger asChild><Button onClick={openNew} className="rounded-full gap-2"><Plus className="h-4 w-4" /> Novo produto</Button></DialogTrigger>
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
                    {["Medicamentos","Vitaminas","Higiene Pessoal","Dermocosméticos","Suplementos"].map((c) => <option key={c}>{c}</option>)}
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 flex items-center gap-3">
                  {p.imagem_url && <img src={p.imagem_url} alt="" className="h-10 w-10 rounded object-cover" />}
                  <span className="font-medium">{p.nome}</span>
                </td>
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

function PedidosAdmin() {
  const { data: pedidos = [] } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("*").order("criado_em", { ascending: false });
      return data ?? [];
    },
  });

  const exportar = () => {
    const rows = pedidos.map((p: any) => ({
      Data: new Date(p.criado_em).toLocaleString("pt-BR"),
      Nome: p.nome_cliente,
      "E-mail": p.email,
      CEP: p.cep,
      Endereço: p.endereco,
      Cidade: p.cidade,
      Estado: p.estado,
      Itens: (p.itens as any[]).map((i) => `${i.quantidade}× ${i.nome}`).join(" | "),
      Subtotal: Number(p.subtotal),
      Frete: Number(p.frete),
      "Desconto PIX": Number(p.desconto_pix),
      Total: Number(p.total),
      "Forma de Pagamento": p.forma_pagamento,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `biofarma-pedidos-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-muted-foreground">{pedidos.length} pedidos</p>
        <Button onClick={exportar} className="rounded-full gap-2"><Download className="h-4 w-4" /> Exportar (.xlsx)</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Cidade/UF</th><th className="p-3">Itens</th><th className="p-3">Total</th><th className="p-3">Pgto</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 text-xs">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                <td className="p-3">
                  <p className="font-semibold">{p.nome_cliente}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </td>
                <td className="p-3 text-xs">{p.cidade}/{p.estado}</td>
                <td className="p-3 text-xs">{(p.itens as any[]).length} itens</td>
                <td className="p-3 font-semibold text-primary">{brl(Number(p.total))}</td>
                <td className="p-3 capitalize text-xs">{p.forma_pagamento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
