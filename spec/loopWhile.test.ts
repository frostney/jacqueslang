import { describe, it, expect } from "bun:test";
import { Jacques } from "../src";
import type { JacquesNumber } from "../src/JacquesValue";

describe("While Loop", () => {
  it("should count to 5", () => {
    const { env } = Jacques.runDebug(`
      // Initialize counter
      counter = 0;
  
      // Simple while loop that counts to 5
      while counter < 5
        Println("Counter: " + counter);
        counter = counter + 1;
      end;
    `);

    expect((env.counter as JacquesNumber).value).toBe(5);
  });

  it("should skip the loop if the condition is false", () => {
    const { env } = Jacques.runDebug(`
      // Initialize counter
      counter = 0;

      // While loop with false condition
      while counter > 5
        Println("This will not be printed");
        counter = counter + 1;
      end;
    `);

    expect((env.counter as JacquesNumber).value).toBe(0);
  });
});
