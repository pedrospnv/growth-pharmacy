import { Leaf, Mail, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export function Footer() {
  const [year, setYear] = useState(2026);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="mt-24 border-t border-border bg-ink text-background">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-accent">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-extrabold">biofarma</span>
          </div>
          <p className="text-sm text-background/70 max-w-xs">
            Sua farmácia online de confiança. Medicamentos, suplementos e cuidados pessoais entregues com agilidade em todo o Brasil.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-wider mb-4 text-background">Atendimento</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li className="flex gap-2 items-center"><Phone className="h-4 w-4" /> 0800 555 0001</li>
            <li className="flex gap-2 items-center"><Mail className="h-4 w-4" /> contato@biofarma.com.br</li>
            <li className="flex gap-2 items-center"><MapPin className="h-4 w-4" /> Seg a Sáb · 8h às 22h</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-wider mb-4">Institucional</h4>
          <ul className="space-y-2 text-sm text-background/70">
            <li>Sobre a BioFarma</li>
            <li>Política de privacidade</li>
            <li>Termos de uso</li>
            <li>Trocas e devoluções</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-wider mb-4">Pagamento</h4>
          <p className="text-sm text-background/70 mb-3">PIX, cartão de crédito e boleto bancário.</p>
          <p className="text-xs text-background/50">Farmacêutico Responsável: Dr. Pedro Andrade · CRF 12345</p>
        </div>
      </div>
      <div className="border-t border-background/10 py-5 text-center text-xs text-background/50">
        © {year} BioFarma · Todos os direitos reservados
      </div>
    </footer>
  );
}
