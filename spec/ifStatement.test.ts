import { describe, expect, it } from "bun:test";
import { Jacques } from "../src";
import type { JacquesString } from "../src/JacquesValue";

describe("If Statement", () => {
  it("should be able to have an if statement", () => {
    const { env } = Jacques.runDebug(`
      if (true) {
        result := "Hello, world!";
      }
    `);

    expect((env.result as JacquesString).value).toBe("Hello, world!");
  });

  it("should be able to have an if statement with an else statement", () => {
    const { env } = Jacques.runDebug(`
      if (true) {
        result := "Hello, world!";
      } else {
        result := "Goodbye, world!";
      }
    `);

    expect((env.result as JacquesString).value).toBe("Hello, world!");
  });

  it("should be able to have an if statement with an else if statement", () => {
    const { env } = Jacques.runDebug(`
      bool := true;

      if (bool) {
        result := "Hello, world!";
      } else if (false) {
        result := "Goodbye, world!";
      } else {
        result := "Goodbye, world!";
      }
    `);

    expect((env.result as JacquesString).value).toBe("Hello, world!");
  });
});
