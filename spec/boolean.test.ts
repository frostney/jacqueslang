import { describe, it, expect } from "bun:test";
import { Jacques } from "../src";
import type {
  JacquesBoolean,
  JacquesNumber,
  JacquesString,
} from "../src/JacquesValue";

describe("Boolean", () => {
  it("should be able to compare two booleans", () => {
    const { env } = Jacques.runDebug(`
      result := true == false;
      result2 := true != false;
    `);

    expect((env.result as JacquesBoolean).value).toBe(false);
    expect((env.result2 as JacquesBoolean).value).toBe(true);
  });

  it("should be able to convert a boolean to a string", () => {
    const { env } = Jacques.runDebug(`
      boolean := true;
      result := boolean.ToString();
    `);

    expect((env.result as JacquesString).value).toBe("true");
  });

  it("should be able to convert a boolean to a number", () => {
    const { env } = Jacques.runDebug(`
      boolean := true;
      result := boolean.ToNumber();
    `);

    expect((env.result as JacquesNumber).value).toBe(1);
  });
});
