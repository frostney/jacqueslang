import { describe, expect, it } from "bun:test";
import { runDebug } from "../src";
import type { JacquesString } from "../src/JacquesValue";

describe("If Statement", () => {
  it("should be able to have an if statement", () => {
    const { env } = runDebug(`
      if true
        result := "Hello, world!";
      end;
    `);

    expect((env.result as JacquesString).value).toBe("Hello, world!");
  });

  it("should be able to have an if statement with an else statement", () => {
    const { env } = runDebug(`
      if true
        result := "Hello, world!";
      end else
        result := "Goodbye, world!";
      end;
    `);

    expect((env.result as JacquesString).value).toBe("Hello, world!");
  });

  it("should be able to have an if statement with an else if statement", () => {
    const { env } = runDebug(`
      bool := true;

      if bool
        result := "Hello, world!";
      end else if false
        result := "Goodbye, world!";
      end else
        result := "Goodbye, world!";
      end;
    `);

    expect((env.result as JacquesString).value).toBe("Hello, world!");
  });
});
