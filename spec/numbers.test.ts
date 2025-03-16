import { describe, expect, it } from "bun:test";
import { runDebug } from "../src";
import type {
  JacquesBoolean,
  JacquesNumber,
  JacquesString,
} from "../src/JacquesValue";

describe("Numbers", () => {
  it("should be able to add two numbers", () => {
    const { env } = runDebug(`result := 1 + 2;`);

    expect((env.result as JacquesNumber).value).toBe(3);
  });

  it("should be able to subtract two numbers", () => {
    const { env } = runDebug(`result := 1 - 2;`);

    expect((env.result as JacquesNumber).value).toBe(-1);
  });

  it("should be able to multiply two numbers", () => {
    const { env } = runDebug(`result := 1 * 2;`);

    expect((env.result as JacquesNumber).value).toBe(2);
  });

  it("should be able to divide two numbers", () => {
    const { env } = runDebug(`result := 1 / 2;`);

    expect((env.result as JacquesNumber).value).toBe(0.5);
  });

  it("should be able to modulo two numbers", () => {
    const { env } = runDebug(`result := 1 % 2;`);

    expect((env.result as JacquesNumber).value).toBe(1);
  });

  it("should be able to compare two numbers", () => {
    const { env } = runDebug(`
      result := 1 < 2;
      result2 := 1 > 2;
      result3 := 1 <= 2;
      result4 := 1 >= 2;
      result5 := 1 == 2;
      result6 := 1 != 2;
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
    expect((env.result2 as JacquesBoolean).value).toBe(false);
    expect((env.result3 as JacquesBoolean).value).toBe(true);
    expect((env.result4 as JacquesBoolean).value).toBe(false);
    expect((env.result5 as JacquesBoolean).value).toBe(false);
    expect((env.result6 as JacquesBoolean).value).toBe(true);
  });

  it("should be able to convert a number to a string", () => {
    const { env } = runDebug(`
      number := 1;
      result := number.ToString();
    `);

    expect((env.result as JacquesString).value).toBe("1");
  });
});
