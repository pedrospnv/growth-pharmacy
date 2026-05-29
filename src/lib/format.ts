export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
export const maskCardNumber = (v: string) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
export const maskCardExp = (v: string) =>
  v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");
export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export const calcFretePorEstado = (uf: string) => {
  const u = uf.toUpperCase();
  if (["SP", "RJ", "MG", "ES"].includes(u)) return 14.9;
  if (["PR", "SC", "RS"].includes(u)) return 19.9;
  if (["DF", "GO", "MT", "MS"].includes(u)) return 24.9;
  if (["BA", "PE", "CE", "RN", "PB", "AL", "SE", "MA", "PI"].includes(u)) return 29.9;
  return 34.9;
};
