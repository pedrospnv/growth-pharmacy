import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Header";

export function Footer() {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 grid-cols-2 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1 space-y-3">
          <Logo light />
          <p className="text-sm text-white/70 max-w-xs">
            Sua farmácia online com medicamentos, manipulação e dermocosméticos. Entrega rápida em todo o Brasil.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-3 text-white">Loja</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/produtos" className="hover:text-amber transition-colors">Todos os produtos</Link></li>
            <li><Link to="/produtos" search={{ categoria: "Medicamentos" } as any} className="hover:text-amber transition-colors">Medicamentos</Link></li>
            <li><Link to="/produtos" search={{ categoria: "Manipulacao" } as any} className="hover:text-amber transition-colors">Manipulação</Link></li>
            <li><Link to="/produtos" search={{ categoria: "Dermocosmeticos" } as any} className="hover:text-amber transition-colors">Dermocosméticos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-3 text-white">Conta</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/conta" className="hover:text-amber transition-colors">Minha conta</Link></li>
            <li><Link to="/pedidos" className="hover:text-amber transition-colors">Meus pedidos</Link></li>
            <li><Link to="/login" className="hover:text-amber transition-colors">Entrar</Link></li>
            <li><Link to="/cadastro" className="hover:text-amber transition-colors">Criar conta</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-3 text-white">Contato</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <a href="https://wa.me/5512992512045" target="_blank" rel="noopener noreferrer" className="hover:text-amber transition-colors">
                (12) 99251-2045
              </a>
            </li>
            <li>Seg a Sex · 8h às 20h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 text-xs text-white/60 flex flex-wrap gap-2 justify-between">
          <span>© {year} Farma Pro. Todos os direitos reservados.</span>
          <span>Farmacêutico Responsável: CRF 00000</span>
        </div>
      </div>
    </footer>
  );
}
