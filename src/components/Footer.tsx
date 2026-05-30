import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Header";

export function Footer() {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="text-sm text-white/70 max-w-xs">
            Sua farmácia online com medicamentos, manipulação e dermocosméticos. Entrega rápida em todo o Brasil.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-4 text-white">Loja</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/produtos" className="hover:text-amber">Todos os produtos</Link></li>
            <li><Link to="/produtos" search={{ categoria: "Medicamentos" } as any} className="hover:text-amber">Medicamentos</Link></li>
            <li><Link to="/produtos" search={{ categoria: "Manipulação" } as any} className="hover:text-amber">Manipulação</Link></li>
            <li><Link to="/produtos" search={{ categoria: "Dermocosméticos" } as any} className="hover:text-amber">Dermocosméticos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-4 text-white">Conta</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/conta" className="hover:text-amber">Minha conta</Link></li>
            <li><Link to="/carrinho" className="hover:text-amber">Carrinho</Link></li>
            <li><Link to="/login" className="hover:text-amber">Entrar</Link></li>
            <li><Link to="/cadastro" className="hover:text-amber">Criar conta</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-4 text-white">Contato</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>contato@farmapro.com.br</li>
            <li>0800 000 0000</li>
            <li>Seg a Sex · 8h às 20h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 text-xs text-white/60 flex flex-wrap gap-3 justify-between">
          <span>© {year} Farma Pro. Todos os direitos reservados.</span>
          <span>Farmacêutico Responsável: Dr. Placeholder · CRF 00000</span>
        </div>
      </div>
    </footer>
  );
}
