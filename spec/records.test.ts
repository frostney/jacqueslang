import { describe, it, expect } from "bun:test";
import { runDebug } from "../src";
import {
  JacquesRecord,
  JacquesString,
  JacquesNumber,
  JacquesBoolean,
} from "../src/JacquesValue";

describe("Records", () => {
  it("should be able to create an object", () => {
    const { env } = runDebug(`
      object := { name: "John", age: 30 };
    `);

    expect((env.object as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });
  });

  it("should be able to add a key to a map", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      map2 := map.Add("name2", "John");
    `);

    expect((env.map as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });

    expect((env.map2 as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
      name2: new JacquesString("John"),
    });
  });

  it("should be able to remove a key from a map", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      map2 := map.Remove("name");
    `);

    expect((env.map as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });

    expect((env.map2 as JacquesRecord).properties).toEqual({
      age: new JacquesNumber(30),
    });
  });

  it("should be able to iterate over a map", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      map.ForEach((key, value) => Println(key, value));
    `);

    expect((env.map as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });
  });

  it("should be able to check if a map contains a key", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      result := map.ContainsKey("name");
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to check if a map contains a value", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      result := map.ContainsValue("John");
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to get the size of a map", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      result := map.Size;
    `);

    expect((env.result as JacquesNumber).value).toBe(2);
  });

  it("allows nested maps", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30, address: { city: "New York", country: "USA" } };
    `);

    expect((env.map as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
      address: new JacquesRecord({
        city: new JacquesString("New York"),
        country: new JacquesString("USA"),
      }),
    });
  });

  it("should be able to merge two maps", () => {
    const { env } = runDebug(`
      map1 := { name: "John", age: 30 };
      map2 := { name2: "Jane", age2: 25 };
      result := map1.Merge(map2);
    `);

    expect((env.result as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
      name2: new JacquesString("Jane"),
      age2: new JacquesNumber(25),
    });
  });

  it("should be able to check if a map is equal to another map", () => {
    const { env } = runDebug(`
      map1 := { name: "John", age: 30 };
      map2 := { name: "John", age: 30 };
      result := map1.Equals(map2);
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to check if a map is not equal to another map", () => {
    const { env } = runDebug(`
      map1 := { name: "John", age: 30 };
      map2 := { name: "Jane", age: 25 };
      result := map1.NotEquals(map2);
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to convert a map to a string", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      result := map.ToString();
    `);

    expect((env.result as JacquesString).value).toBe(
      `{ name: "John", age: 30 }`
    );
  });

  describe("should be able to get a value from a map", () => {
    it("using the `Get` method", () => {
      const { env } = runDebug(`
        map := { name: "John", age: 30 };
        result := map.Get("name");
      `);

      expect((env.result as JacquesString).value).toBe("John");
    });

    it("using the `[]` operator", () => {
      const { env } = runDebug(`
        map := { name: "John", age: 30 };
        result := map["name"];
      `);

      expect((env.result as JacquesString).value).toBe("John");
    });

    it("using the `.` operator", () => {
      const { env } = runDebug(`
        map := { name: "John", age: 30 };
        result := map.name;
      `);

      expect((env.result as JacquesString).value).toBe("John");
    });
  });

  describe("should be able to set a value in a map", () => {
    it("using the `Set` method", () => {
      const { env } = runDebug(`
        map := { name: "John", age: 30 };
        map2 := map.Set("name", "Jane");
      `);

      expect((env.map as JacquesRecord).properties).toEqual({
        name: new JacquesString("John"),
        age: new JacquesNumber(30),
      });

      expect((env.map2 as JacquesRecord).properties).toEqual({
        name: new JacquesString("Jane"),
        age: new JacquesNumber(30),
      });
    });
  });

  it("should be able to convert to JSON", () => {
    const { env } = runDebug(`
      map := { name: "John", age: 30 };
      result := map.ToJSON();
    `);

    expect((env.result as JacquesString).value).toBe(
      `{ "name": "John", "age": 30 }`
    );
  });
});
