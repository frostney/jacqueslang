import { describe, expect, it } from "bun:test";
import { runDebug } from "../src";
import type {
  JacquesBoolean,
  JacquesNumber,
  JacquesString,
} from "../src/JacquesValue";

describe("Strings", () => {
  it("should be able to add two strings", () => {
    const { env } = runDebug(`result := "Hello" + "World";`);

    expect((env.result as JacquesString).value).toBe("HelloWorld");
  });

  it("should be able to compare two strings", () => {
    const { env } = runDebug(`result := "Hello" == "World";`);

    expect((env.result as JacquesBoolean).value).toBe(false);
  });

  it("should be able to compare two strings", () => {
    const { env } = runDebug(`
      result := "Hello" != "World";
      result2 := "Hello" == "Hello";
      result3 := "Hello" != "Hello";
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
    expect((env.result2 as JacquesBoolean).value).toBe(true);
    expect((env.result3 as JacquesBoolean).value).toBe(false);
  });

  it("should be able to convert a string to a number", () => {
    const { env } = runDebug(`result := "1".ToNumber();`);

    expect((env.result as JacquesNumber).value).toBe(1);
  });

  it("should be able to convert a string to a boolean", () => {
    const { env } = runDebug(`result := "true".ToBoolean();`);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });
});
