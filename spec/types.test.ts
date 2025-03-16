import { describe, it, expect } from "bun:test";
import { Jacques } from "../src";
import {
  JacquesNumber,
  JacquesString,
  type JacquesRecord,
  type JacquesArray,
  type JacquesBoolean,
} from "../src/JacquesValue";

describe("Types", () => {
  it("should be able to define types with implicit default values", () => {
    const { env } = Jacques.runDebug(`
      num: Number;
      str: String;
      map: Record;
      arr: Array;
      bool: Boolean;
    `);

    expect((env.num as JacquesNumber).value).toBe(0);
    expect((env.num as JacquesNumber).constantValue).toBe(false);
    expect((env.num as JacquesNumber).__type__).toBe("JacquesNumber");
    expect((env.str as JacquesString).value).toBe("");
    expect((env.str as JacquesString).constantValue).toBe(false);
    expect((env.str as JacquesString).__type__).toBe("JacquesString");
    expect((env.map as JacquesRecord).properties).toEqual({});
    expect((env.map as JacquesRecord).constantValue).toBe(false);
    expect((env.map as JacquesRecord).__type__).toBe("JacquesRecord");
    expect((env.arr as JacquesArray).elements).toEqual([]);
    expect((env.arr as JacquesArray).constantValue).toBe(false);
    expect((env.arr as JacquesArray).__type__).toBe("JacquesArray");
    expect((env.bool as JacquesBoolean).value).toBe(true);
    expect((env.bool as JacquesBoolean).constantValue).toBe(false);
    expect((env.bool as JacquesBoolean).__type__).toBe("JacquesBoolean");
  });

  it("should be able to define types with explicit default values", () => {
    const { env } = Jacques.runDebug(`
      num: Number := 5;
      str: String := "Hello";
      map: Record := { "key": "value" };
      arr: Array := [1, 2, 3];
      bool: Boolean := false;
    `);

    expect((env.num as JacquesNumber).value).toBe(5);
    expect((env.num as JacquesNumber).constantValue).toBe(true);
    expect((env.str as JacquesString).value).toBe("Hello");
    expect((env.str as JacquesString).constantValue).toBe(true);
    expect((env.map as JacquesRecord).properties).toEqual({
      key: new JacquesString("value"),
    });
    expect((env.map as JacquesRecord).constantValue).toBe(true);
    expect((env.arr as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);
    expect((env.bool as JacquesBoolean).value).toBe(false);
    expect((env.bool as JacquesBoolean).constantValue).toBe(true);
  });

  it("should be able to define types implicitly", () => {
    const { env } = Jacques.runDebug(`
      num := 5;
      str := "Hello";
      map := { "key": "value" };
      arr := [1, 2, 3];
      bool := true;
    `);

    expect((env.num as JacquesNumber).value).toBe(5);
    expect((env.str as JacquesString).value).toBe("Hello");
    expect((env.map as JacquesRecord).properties).toEqual({
      key: new JacquesString("value"),
    });
    expect((env.arr as JacquesArray).elements).toEqual([
      new JacquesNumber(1),
      new JacquesNumber(2),
      new JacquesNumber(3),
    ]);
    expect((env.bool as JacquesBoolean).value).toBe(true);
  });

  it("should be able to reassign value of the same type", () => {
    const { env } = Jacques.runDebug(`
      num = 5;
      num = 10;
    `);

    expect((env.num as JacquesNumber).value).toBe(10);
  });

  it("should error when reassigning value of different type", () => {
    // We know the error will be thrown, so we use try/catch
    let errorMessage = "";
    try {
      const { env } = Jacques.runDebug(`
        num = 5;
        num = "Hello";
      `);
    } catch (e) {
      if (e instanceof Error) {
        errorMessage = e.message;
      }
    }

    // Make sure the error message includes the type error
    expect(errorMessage).toContain("Type error");
  });
});
