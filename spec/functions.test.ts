import { describe, it, expect } from "bun:test";
import { Jacques } from "../src";
import type {
  JacquesFunction,
  JacquesNumber,
  JacquesString,
} from "../src/JacquesValue";

describe("Functions", () => {
  it("should be able to have a function declaration", () => {
    const { env } = Jacques.runDebug(`
      function add(a: Number, b: Number)
        Result := a + b;
      end;

      result := add(1, 2);
    `);

    expect((env.result as JacquesNumber).value).toBe(3);
    expect((env.add as JacquesFunction).name).toBe("add");
    expect((env.add as JacquesFunction).params.length).toBe(2);
  });

  it("should be able to have a function expression", () => {
    const { env } = Jacques.runDebug(`
      multiply := function(a: Number, b: Number)
        Result := a * b;
      end;

      result := multiply(2, 3);
    `);

    expect((env.result as JacquesNumber).value).toBe(6);
    expect((env.multiply as JacquesFunction).name).toBe("anonymous");
    expect((env.multiply as JacquesFunction).params.length).toBe(2);
  });

  describe("lambda expressions", () => {
    it("parameters without parentheses if there is only one parameter", () => {
      const { env } = Jacques.runDebug(`
        square := (x: Number) => x * x;
  
        result := square(5);
      `);

      expect((env.result as JacquesNumber).value).toBe(25);
      expect((env.square as JacquesFunction).name).toBe("lambda");
      expect((env.square as JacquesFunction).params.length).toBe(1);
    });

    it("parentheses are required if there are multiple parameters", () => {
      const { env } = Jacques.runDebug(`
        add := (a: Number, b: Number) => a + b;

        result := add(1, 2);
      `);
    });

    it("can have a default parameter", () => {
      const { env } = Jacques.runDebug(`
        greet := (name = "Guest") => "Hello, " + name;

        result := greet();
      `);

      expect((env.result as JacquesString).value).toBe("Hello, Guest");
    });
  });

  it("should be able to have a default parameter", () => {
    const { env } = Jacques.runDebug(`
      function greet(name = "Guest")
        Result := "Hello, " + name;
      end;

      result := greet("Jacques");
    `);

    expect((env.result as JacquesString).value).toBe("Hello, Jacques");
    expect((env.greet as JacquesFunction).name).toBe("greet");
    expect((env.greet as JacquesFunction).params.length).toBe(1);
  });

  it("should be able to have a function property", () => {
    const { env } = Jacques.runDebug(`
      function add(a: Number, b: Number)
        Result := a + b;
      end;

      add.description := "Adds two numbers";

      result := add(1, 2);
    `);

    interface JacquesFunctionWithDescription extends JacquesFunction {
      description: JacquesString;
    }

    expect((env.result as JacquesNumber).value).toBe(3);
    expect(
      ((env.add as JacquesFunctionWithDescription).description as JacquesString)
        .value
    ).toBe("Adds two numbers");
  });

  it("should be able to bind a function", () => {
    const { env } = Jacques.runDebug(`
      function greet(name: String)
        Result := "Hello, " + name;
      end;

      logGreeting := greet.Bind("Jacques");

      result := logGreeting("World");
    `);

    expect((env.result as JacquesString).value).toBe("Hello, Jacques");
    expect((env.logGreeting as JacquesFunction).name).toBe("greet_bound");
    expect((env.logGreeting as JacquesFunction).params.length).toBe(1);
  });

  it("should be able to apply a function", () => {
    const { env } = Jacques.runDebug(`
      function sum3(a: Number, b: Number, c: Number)
        Result := a + b + c;
      end;

      args := [1, 2, 3];

      result := sum3.Apply(args);
    `);

    expect((env.result as JacquesNumber).value).toBe(6);
    expect((env.sum3 as JacquesFunction).name).toBe("sum3");
    expect((env.sum3 as JacquesFunction).params.length).toBe(3);
  });

  it("should be able to compose functions", () => {
    const { env } = Jacques.runDebug(`
      function addFive(x: Number)
        Result := x + 5;
      end;

      function double(x: Number)
        Result := x * 2;
      end;

      addFiveAfterDouble := addFive.Compose(double);

      result := addFiveAfterDouble(10);
    `);

    expect((env.result as JacquesNumber).value).toBe(25);
    expect((env.addFiveAfterDouble as JacquesFunction).name).toBe(
      "addFive_double_composed"
    );
    expect((env.addFiveAfterDouble as JacquesFunction).params.length).toBe(1);
  });

  it("should be able to introspect a function", () => {
    const { env } = Jacques.runDebug(`
      function add(a: Number, b: Number)
        Result := a + b;
      end;

      result := add.name;
    `);

    expect((env.result as JacquesString).value).toBe("add");
  });

  it("allows immediately invoked function expressions", () => {
    const { env } = Jacques.runDebug(`
      result: Number := (function() 
        temp := 10;
        Result := temp * 2;
      end)();
    `);

    expect((env.result as JacquesNumber).value).toBe(20);
  });

  describe("closures", () => {
    it("should be able to make a counter", () => {
      const { env } = Jacques.runDebug(`
        function makeCounter()
          count = 0;

          Result := function()
            count = count + 1;
            Result := count;
          end;
        end;

        counter := makeCounter();

        result1 := counter();
        result2 := counter();
        result3 := counter();
      `);

      expect((env.result1 as JacquesNumber).value).toBe(1);
      expect((env.result2 as JacquesNumber).value).toBe(2);
      expect((env.result3 as JacquesNumber).value).toBe(3);
    });

    it("should be able to make a function that returns a function", () => {
      const { env } = Jacques.runDebug(`
        function makeAdder(x)
          Result := function(y)
            Result := x + y;
          end;
        end;

        adder := makeAdder(5);

        result := adder(10);
      `);

      expect((env.result as JacquesNumber).value).toBe(15);
    });
  });

  it("should be able to have a function as an argument", () => {
    const { env } = Jacques.runDebug(`
      function add(a, b)
        Result := a + b;
      end;

      function applyOperation(a, b, operation)
        Result := operation(a, b);
      end;

      result := applyOperation(10, 20, add);
    `);

    expect((env.result as JacquesNumber).value).toBe(30);
  });

  it("should be able to call functions recursively", () => {
    const { env } = Jacques.runDebug(`
      function factorial(n)
        if n <= 1
          Result := 1;
        else
          Result := n * factorial(n - 1);
        end;
      end;

      result := factorial(5);
    `);

    expect((env.result as JacquesNumber).value).toBe(120);
  });
});
