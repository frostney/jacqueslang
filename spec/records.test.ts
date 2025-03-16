import { describe, it, expect } from "bun:test";
import { runDebug } from "../src";
import {
  JacquesRecord,
  JacquesString,
  JacquesNumber,
  JacquesBoolean,
} from "../src/JacquesValue";

describe("Records", () => {
  it("should be able to create a record", () => {
    const { env } = runDebug(`
      object := { name: "John", age: 30 };
    `);

    expect((env.object as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });
  });

  it("should be able to add a key to a record", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      record2 := record.Add("name2", "John");
    `);

    expect((env.record as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });

    expect((env.record2 as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
      name2: new JacquesString("John"),
    });
  });

  it("should be able to remove a key from a record", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      record2 := record.Remove("name");
    `);

    expect((env.record as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });

    expect((env.record2 as JacquesRecord).properties).toEqual({
      age: new JacquesNumber(30),
    });
  });

  it("should be able to iterate over a record", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      record.ForEach((key, value) => Println(key, value));
    `);

    expect((env.record as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
    });
  });

  it("should be able to check if a record contains a key", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      result := record.ContainsKey("name");
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to check if a record contains a value", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      result := record.ContainsValue("John");
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to get the size of a record", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      result := record.Size;
    `);

    expect((env.result as JacquesNumber).value).toBe(2);
  });

  it("allows nested maps", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30, address: { city: "New York", country: "USA" } };
    `);

    const record = env.record as JacquesRecord;
    expect(record.properties.name instanceof JacquesString).toBe(true);
    expect((record.properties.name as JacquesString).value).toBe("John");

    expect(record.properties.age instanceof JacquesNumber).toBe(true);
    expect((record.properties.age as JacquesNumber).value).toBe(30);

    expect(record.properties.address instanceof JacquesRecord).toBe(true);
    const address = record.properties.address as JacquesRecord;

    expect(address.properties.city instanceof JacquesString).toBe(true);
    expect((address.properties.city as JacquesString).value).toBe("New York");

    expect(address.properties.country instanceof JacquesString).toBe(true);
    expect((address.properties.country as JacquesString).value).toBe("USA");
  });

  it("should be able to merge two records", () => {
    const { env } = runDebug(`
      record1 := { name: "John", age: 30 };
      record2 := { name2: "Jane", age2: 25 };
      result := record1.Merge(record2);
    `);

    expect((env.result as JacquesRecord).properties).toEqual({
      name: new JacquesString("John"),
      age: new JacquesNumber(30),
      name2: new JacquesString("Jane"),
      age2: new JacquesNumber(25),
    });
  });

  it("should be able to check if a record is equal to another record", () => {
    const { env } = runDebug(`
      record1 := { name: "John", age: 30 };
      record2 := { name: "John", age: 30 };
      result := record1.Equals(record2);
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to check if a record is not equal to another record", () => {
    const { env } = runDebug(`
      record1 := { name: "John", age: 30 };
      record2 := { name: "Jane", age: 25 };
      result := record1.NotEquals(record2);
    `);

    expect((env.result as JacquesBoolean).value).toBe(true);
  });

  it("should be able to convert a record to a string", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      result := record.ToString();
    `);

    expect((env.result as JacquesString).value).toBe(
      `{ name: "John", age: 30 }`
    );
  });

  describe("should be able to get a value from a record", () => {
    it("using the `Get` method", () => {
      const { env } = runDebug(`
        record := { name: "John", age: 30 };
        result := record.Get("name");
      `);

      expect((env.result as JacquesString).value).toBe("John");
    });

    it("using the `[]` operator", () => {
      const { env } = runDebug(`
        record := { name: "John", age: 30 };
        result := record["name"];
      `);

      expect((env.result as JacquesString).value).toBe("John");
    });

    it("using the `.` operator", () => {
      const { env } = runDebug(`
        record := { name: "John", age: 30 };
        result := record.name;
      `);

      expect((env.result as JacquesString).value).toBe("John");
    });
  });

  describe("should be able to set a value in a record", () => {
    it("using the `Set` method", () => {
      const { env } = runDebug(`
        record := { name: "John", age: 30 };
        record2 := record.Set("name", "Jane");
      `);

      expect((env.record as JacquesRecord).properties).toEqual({
        name: new JacquesString("John"),
        age: new JacquesNumber(30),
      });

      expect((env.record2 as JacquesRecord).properties).toEqual({
        name: new JacquesString("Jane"),
        age: new JacquesNumber(30),
      });
    });
  });

  it("should be able to convert to JSON", () => {
    const { env } = runDebug(`
      record := { name: "John", age: 30 };
      result := record.ToJSON();
    `);

    expect((env.result as JacquesString).value).toBe(
      `{ "name": "John", "age": 30 }`
    );
  });
});
