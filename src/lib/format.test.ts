import { describe, expect, test } from "bun:test";
import { calcFretePorCep, maskCardExp, maskCardNumber, maskCep, maskCpf, onlyDigits } from "./format";
import { paymentMatchesOrder } from "./payment-validation";

describe("format helpers", () => {
  test("normalizes digits", () => {
    expect(onlyDigits("(11) 98765-4321")).toBe("11987654321");
  });
  test("applies CPF, CEP and card masks", () => {
    expect(maskCpf("12345678901")).toBe("123.456.789-01");
    expect(maskCep("12345678")).toBe("12345-678");
    expect(maskCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(maskCardExp("1229")).toBe("12/29");
  });
  test("calculates freight by CEP region and rejects incomplete CEPs", () => {
    expect(calcFretePorCep("01000-000")).toBe(17.5);
    expect(calcFretePorCep("20000-000")).toBe(24.9);
    expect(calcFretePorCep("")).toBe(0);
  });
});

describe("payment to order validation", () => {
  const order = { total: 125.5, email: "cliente@example.com" };

  test("accepts a matching amount and account email", () => {
    expect(paymentMatchesOrder({
      transaction_amount: 125.5,
      payer: { email: "CLIENTE@example.com" },
    }, order)).toBe(true);
  });

  test("rejects a different amount or payer", () => {
    expect(paymentMatchesOrder({
      transaction_amount: 1,
      payer: { email: "cliente@example.com" },
    }, order)).toBe(false);
    expect(paymentMatchesOrder({
      transaction_amount: 125.5,
      payer: { email: "outra@example.com" },
    }, order)).toBe(false);
  });
});
