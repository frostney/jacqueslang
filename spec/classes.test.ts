import { Jacques } from "../src";
import { describe, it, expect } from "bun:test";
import {
  JacquesNumber,
  JacquesString,
  JacquesValue,
} from "../src/JacquesValue";
describe("Classes", () => {
  it("should be able to create a class", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        name := "John";
        age := 30;
      }

      person := Person();
    `);

    interface Person extends JacquesValue {
      name: string;
      age: number;
    }

    expect(env.person).toBeDefined();
    expect((env.person as Person).name).toBe("John");
    expect((env.person as Person).age).toBe(30);
  });

  it("should be able to define methods", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        name := "John";
        age := 30;

        SayHello() {
          Println("Hello, my name is " + name);
        }
      }

      person := Person();
      person.SayHello();
    `);

    interface Person extends JacquesValue {
      name: string;
      age: number;
      SayHello: () => void;
    }

    expect(env.person).toBeDefined();
    expect((env.person as Person).SayHello).toBeDefined();
    expect((env.person as Person).name).toBe("John");
    expect((env.person as Person).age).toBe(30);
  });

  it("should be able to define properties", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        name = "John";
        age = 30;
      }

      person := Person();
      person.name = "Jane";
      person.age = 25;
    `);

    interface Person extends JacquesValue {
      name: string;
      age: number;
    }

    expect(env.person).toBeDefined();
    expect((env.person as Person).name).toBe("Jane");
    expect((env.person as Person).age).toBe(25);
  });

  it("should be able to define static properties", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        static name = "John";
        static age = 30;
      }

      result := Person.name;
      result2 := Person.age;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
  });

  it("should be able to define static methods", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        static SayHello() {
          Println("Hello, my name is " + Person.name);
        }
      }

      Person.SayHello();
    `);

    expect((env.result as JacquesString).value).toBe("Hello, my name is John");
  });

  it("should be able to define private properties", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        private name = "John";
        private age = 30;
      }

      person := Person();
      result := person.name;
      result2 := person.age;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
  });

  it("should be able to define private methods", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        private SayHello() {
          Println("Hello, my name is " + Person.name);
        }
      }

      person := Person();
      person.SayHello();
    `);

    expect((env.result as JacquesString).value).toBe("Hello, my name is John");
  });

  it("should be able to define protected properties", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        protected name = "John";
        protected age = 30;
      }

      class Employee extends Person {
        protected salary = 50000;
      }

      employee := Employee();
      result := employee.name;
      result2 := employee.age;
      result3 := employee.salary;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
    expect((env.result3 as JacquesNumber).value).toBe(50000);
  });

  it("should be able to define protected methods", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        protected SayHello() {
          Println("Hello, my name is " + Person.name);
        }
      }

      class Employee extends Person {
        protected salary = 50000;
      }

      employee := Employee();
      employee.SayHello();
    `);

    expect((env.result as JacquesString).value).toBe("Hello, my name is John");
  });

  it("should be able to define a constructor", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        constructor(name, age) {
          self.name = name;
          self.age = age;
        }
      }

      person := Person("John", 30);
      result := person.name;
      result2 := person.age;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
  });

  it("should be able to define a class that extends another class", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        constructor(name, age) {
          self.name = name;
          self.age = age;
        }
      }

      class Employee extends Person {
        constructor(name, age, salary) {
          super(name, age);
          self.salary = salary;
        }
      }

      employee := Employee("John", 30, 50000);
      result := employee.name;
      result2 := employee.age;
      result3 := employee.salary;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
    expect((env.result3 as JacquesNumber).value).toBe(50000);
  });

  it("allows to use `@` instead of `self`", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        name = "John";

        GetName() {
          return @name;
        }
      }

      person := Person();
      result := person.GetName();
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to use `@` instead of `self` in a constructor", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        constructor(name) {
          @name = name;
        }
      }

      person := Person("John");
      result := person.name;
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to use `@` instead of `self` in a method", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        name = "John";

        GetNameAsWell() {
          return @GetName();
        }

        GetName() {
          return @name;
        }
      }

      person := Person();
      result := person.GetNameAsWell();
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to use `@` in constructor parameters", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        constructor(@name) {}
      }

      person := Person("John");
      result := person.name;
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to create property with getter and setter", () => {
    const { env } = Jacques.runDebug(`
      class Person {
        name = "John";

        GetName() {
          return @name;
        }

        SetName(name) {
          @name = name;
        }
      }

      person := Person();
      result := person.GetName();
      person.SetName("Jane");
      result2 := person.GetName();
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesString).value).toBe("Jane");
  });
});
