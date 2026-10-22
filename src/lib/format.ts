export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
export const maskCardNumber = (v: string) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
export const maskCardExp = (v: string) =>
  v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");
export const onlyDigits = (v: string) => v.replace(/\D/g, "");
export const maskCpf = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

/**
 * Cálculo de frete baseado na tabela aproximada do Correios PAC
 * (origem São Paulo capital, encomenda padrão até 1kg, dimensões
 * mínimas). Valores praticados pelos Correios em 2025 — usados aqui
 * como referência sem necessidade de contrato/API autenticada.
 *
 * A faixa é determinada pelos 2 primeiros dígitos do CEP de destino,
 * que correspondem às regiões oficiais definidas pelos Correios.
 */
export const calcFretePorCep = (cep: string): number => {
  const d = onlyDigits(cep);
  if (d.length !== 8) return 0;
  const prefix = parseInt(d.slice(0, 2), 10);

  // São Paulo capital
  if (prefix >= 1 && prefix <= 5) return 17.5;
  // Grande SP
  if (prefix >= 6 && prefix <= 9) return 19.9;
  // Interior de SP
  if (prefix >= 11 && prefix <= 19) return 21.5;
  // Rio de Janeiro
  if (prefix >= 20 && prefix <= 28) return 24.9;
  // Espírito Santo
  if (prefix >= 29 && prefix <= 29) return 27.5;
  // Minas Gerais
  if (prefix >= 30 && prefix <= 39) return 25.9;
  // Bahia
  if (prefix >= 40 && prefix <= 48) return 32.5;
  // Sergipe
  if (prefix === 49) return 33.9;
  // Pernambuco
  if (prefix >= 50 && prefix <= 56) return 35.5;
  // Alagoas
  if (prefix === 57) return 35.9;
  // Paraíba
  if (prefix === 58) return 36.5;
  // Rio Grande do Norte
  if (prefix === 59) return 37.5;
  // Ceará
  if (prefix >= 60 && prefix <= 63) return 38.9;
  // Piauí
  if (prefix === 64) return 40.5;
  // Maranhão
  if (prefix === 65) return 41.5;
  // Pará
  if (prefix >= 66 && prefix <= 68) return 47.9;
  // Amapá / Amazonas / Roraima / Acre
  if (prefix === 69) return 52.9;
  // Distrito Federal
  if (prefix >= 70 && prefix <= 73) return 27.5;
  // Goiás
  if (prefix >= 74 && prefix <= 76) return 29.9;
  // Tocantins
  if (prefix === 77) return 34.9;
  // Mato Grosso
  if (prefix === 78) return 36.9;
  // Mato Grosso do Sul
  if (prefix === 79) return 31.9;
  // Paraná
  if (prefix >= 80 && prefix <= 87) return 22.5;
  // Santa Catarina
  if (prefix >= 88 && prefix <= 89) return 24.9;
  // Rio Grande do Sul
  if (prefix >= 90 && prefix <= 99) return 27.9;

  return 39.9;
};

/** @deprecated use calcFretePorCep — mantido por compatibilidade */
export const calcFretePorEstado = (uf: string) => {
  const u = uf.toUpperCase();
  if (["SP"].includes(u)) return 19.9;
  if (["RJ", "MG", "ES"].includes(u)) return 25.9;
  if (["PR", "SC"].includes(u)) return 23.9;
  if (["RS"].includes(u)) return 27.9;
  if (["DF", "GO"].includes(u)) return 28.9;
  if (["MT", "MS", "TO"].includes(u)) return 33.9;
  if (["BA", "SE"].includes(u)) return 32.9;
  if (["PE", "AL", "PB", "RN"].includes(u)) return 35.9;
  if (["CE", "PI", "MA"].includes(u)) return 39.9;
  if (["PA", "AP", "AM", "RR", "AC", "RO"].includes(u)) return 49.9;
  return 39.9;
};
