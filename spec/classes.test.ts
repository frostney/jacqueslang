import { runDebug } from "../src";
import { describe, it, expect } from "bun:test";
import {
  JacquesFunction,
  JacquesNumber,
  JacquesString,
  JacquesValue,
  JacquesRecord,
  JacquesClass,
} from "../src/JacquesValue";

describe("Classes", () => {
  it("should be able to create a class", () => {
    const { env } = runDebug(`
      class Person
        name := "John";
        age := 30;
      end;

      person := Person();
    `);

    console.log("Person object type:", typeof env.person);
    console.log("Person object keys:", Object.keys(env.person));
    console.log(
      "Person object properties:",
      Object.getOwnPropertyNames(env.person)
    );
    console.log("Person object instance properties:", env.person.properties);

    expect(env.person).toBeDefined();
    expect(
      ((env.person as JacquesClass).instanceProperties.name as JacquesString)
        .value
    ).toBe("John");
    expect(
      ((env.person as JacquesClass).instanceProperties.age as JacquesNumber)
        .value
    ).toBe(30);
  });

  it("should be able to define methods", () => {
    const { env } = runDebug(`
      class Person 
        name := "John";
        age := 30;
        
        SayName()
          return self.name;
        end;
      end;

      person := Person();
      result := person.SayName();
    `);

    console.log("Person object:", env.person);
    console.log("Person object type:", typeof env.person);
    console.log("Person object keys:", Object.keys(env.person));
    console.log(
      "Person object properties:",
      Object.getOwnPropertyNames(env.person)
    );

    if (env.person instanceof JacquesRecord) {
      console.log("Person properties:", env.person.properties);
      console.log("Person methods:", env.person.methods);

      if (env.person.methods && env.person.methods.SayName) {
        console.log("SayName method exists:", env.person.methods.SayName);
      } else {
        console.log("SayName method does not exist in methods");
      }

      if (env.person.properties.SayName) {
        console.log(
          "SayName exists in properties:",
          env.person.properties.SayName
        );
      } else {
        console.log("SayName does not exist in properties");
      }
    }

    console.log("Result:", env.result);

    interface Person extends JacquesValue {
      name: JacquesString;
      age: JacquesNumber;
      SayName: JacquesFunction;
      properties: Record<string, JacquesValue>;
    }

    expect(env.person).toBeDefined();
    expect(
      ((env.person as Person).properties.name as JacquesString).value
    ).toBe("John");
    expect(((env.person as Person).properties.age as JacquesNumber).value).toBe(
      30
    );
    expect((env.person as Person).properties.SayName).toBeDefined();
  });

  it("should be able to define properties", () => {
    const { env } = runDebug(`
      class Person 
        name := "Jane";
        age := 25;
      end;

      person := Person();
    `);

    interface Person extends JacquesValue {
      name: JacquesString;
      age: JacquesNumber;
      properties: Record<string, JacquesValue>;
    }

    expect(env.person).toBeDefined();
    expect(
      ((env.person as Person).properties.name as JacquesString).value
    ).toBe("Jane");
    expect(((env.person as Person).properties.age as JacquesNumber).value).toBe(
      25
    );
  });

  it("should be able to define static properties", () => {
    const { env } = runDebug(`
      class Person 
        static name := "John";
        static age := 30;
      end;

      result := Person.name;
      result2 := Person.age;
    `);

    console.log("Person class:", env.Person);
    if (env.Person) {
      console.log("Person class type:", typeof env.Person);
      console.log("Person class constructor:", env.Person.constructor.name);
      console.log(
        "Person class static properties:",
        (env.Person as any).staticProperties
      );
    }
    console.log("Result:", env.result);
    console.log("Result2:", env.result2);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
  });

  it("should be able to define static methods", () => {
    const { env } = runDebug(`
      class Person 
        static SayHello()
          Println("Hello, my name is " + Person.name);
        end;
      end;

      Person.SayHello();
    `);

    expect((env.Result as JacquesString).value).toBe(
      "Hello, my name is Person"
    );
  });

  it("should be able to define private properties", () => {
    const { env } = runDebug(`
      class Person 
        private name = "John";
        private age = 30;
      end;

      person := Person();
      result := person.name;
      result2 := person.age;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
  });

  it("should be able to define private methods", () => {
    const { env } = runDebug(`
      class Person 
        private SayHello()
          Println("Hello, my name is " + Person.name);
        end;
      end;

      person := Person();
      person.SayHello();
    `);

    expect((env.result as JacquesString).value).toBe("Hello, my name is John");
  });

  it("should be able to define protected properties", () => {
    const { env } = runDebug(`
      class Person 
        protected name = "John";
        protected age = 30;
      end;

      class Employee extends Person 
        protected salary = 50000;
      end;

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
    const { env } = runDebug(`
      class Person 
        protected SayHello()
          Println("Hello, my name is " + Person.name);
        end;
      end;

      class Employee extends Person 
        protected salary = 50000;
      end;

      employee := Employee();
      employee.SayHello();
    `);

    expect((env.result as JacquesString).value).toBe("Hello, my name is John");
  });

  it("should be able to define a constructor", () => {
    const { env } = runDebug(`
      class Person 
        constructor(name, age) 
          self.name = name;
          self.age = age;
        end;
      end;

      person := Person("John", 30);
      result := person.name;
      result2 := person.age;
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesNumber).value).toBe(30);
  });

  it("should be able to define a class that extends another class", () => {
    const { env } = runDebug(`
      class Person 
        constructor(name, age)
          self.name = name;
          self.age = age;
        end;
      end;

      class Employee extends Person
        constructor(name, age, salary)
          super(name, age);
          self.salary = salary;
        end;
      end;

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
    const { env } = runDebug(`
      class Person 
        name = "John";

        GetName()
          return @name;
        end;
      end;

      person := Person();
      result := person.GetName();
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to use `@` instead of `self` in a constructor", () => {
    const { env } = runDebug(`
      class Person 
        constructor(name) 
          @name = name;
        end;
      end;

      person := Person("John");
      result := person.name;
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to use `@` instead of `self` in a method", () => {
    const { env } = runDebug(`
      class Person 
        name = "John";

        GetNameAsWell()
          return @GetName();
        end;

        GetName()
          return @name;
        end;
      end;

      person := Person();
      result := person.GetNameAsWell();
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to use `@` in constructor parameters", () => {
    const { env } = runDebug(`
      class Person 
        constructor(@name) 
      end;

      person := Person("John");
      result := person.name;
    `);

    expect((env.result as JacquesString).value).toBe("John");
  });

  it("allows to create property with getter and setter", () => {
    const { env } = runDebug(`
      class Person
        name = "John";

        GetName()
          return @name;
        end;

        SetName(name)
          @name = name;
        end;
      end;

      person := Person();
      result := person.GetName();
      person.SetName("Jane");
      result2 := person.GetName();
    `);

    expect((env.result as JacquesString).value).toBe("John");
    expect((env.result2 as JacquesString).value).toBe("Jane");
  });
});
