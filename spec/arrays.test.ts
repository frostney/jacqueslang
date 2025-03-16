import { describe, it, expect } from "bun:test";
import { Jacques } from "../src";
import {
  JacquesArray,
  JacquesBoolean,
  JacquesNumber,
} from "../src/JacquesValue";

describe("Arrays", () => {
  it("should be able to create an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
    `);

    expect((env.array as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);
  });

  it("should be able to add an element to an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      array2 := array.Add(4);
    `);

    expect((env.array as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);

    expect((env.array2 as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
      new JacquesNumber(4),
    ]);
  });

  it("should be able to remove an element from an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      array2 := array.Remove(1);
    `);

    expect((env.array as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);

    expect((env.array2 as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(3),
    ]);
  });

  describe("should be able to get an element from an array", () => {
    it("using the `Get` method", () => {
      const { env } = Jacques.runDebug(`
        array := [1, 2, 3];
        result := array.Get(1);
      `);

      expect((env.result as JacquesNumber).value).toBe(2);
    });

    it("using the `[]` operator", () => {
      const { env } = Jacques.runDebug(`
        array := [1, 2, 3];
        result := array[1];
      `);

      expect((env.result as JacquesNumber).value).toBe(2);
    });
  });

  it("should be able to get the length of an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      result := array.Length;
    `);

    expect((env.result as JacquesNumber).value).toBe(3);
  });

  it("should be able to iterate over an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      array.ForEach(element => Println(element));
    `);

    expect((env.array as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);
  });

  it("should be able to iterate over an array with a for loop", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      val1 = 0;
      val2 = 0;
      val3 = 0;
      
      array.ForEach(element => {
        val1 = val1 + element;
        val2 = val2 + element;
        val3 = val3 + element;
      });
    `);

    expect((env.array as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);
    expect((env.val1 as JacquesNumber).value).toBe(6);
    expect((env.val2 as JacquesNumber).value).toBe(6);
    expect((env.val3 as JacquesNumber).value).toBe(6);
  });

  it("should be able to iterate over an array with a while loop", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      index := 0;
      while (index < array.Length)
        Println(array[index]);
        index++;
      end;
    `);

    expect((env.array as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);
  });

  it("should be able to map over an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      result := array.Map(element => element * 2);
    `);

    expect((env.result as JacquesArray).elements).toEqual([
      new JacquesNumber(2),
      new JacquesNumber(4),
      new JacquesNumber(6),
    ]);
  });

  it("should be able to filter an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      result := array.Filter(element => element % 2 == 0);
    `);

    expect((env.result as JacquesArray).elements).toEqual([
      new JacquesNumber(2),
    ]);
  });

  it("should be able to reduce an array", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      result := array.Reduce(0, (acc, element) => acc + element);
    `);

    expect((env.result as JacquesNumber).value).toBe(6);
  });

  it("should be able to check if an array contains an element", () => {
    const { env } = Jacques.runDebug(`
      array := [1, 2, 3];
      result := array.Contains(2);
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });
});
