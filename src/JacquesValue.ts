export abstract class JacquesValue {
  __constant__: boolean = false;
  __call__?(args: JacquesValue[]): JacquesValue | null; // Optional __call__ method for callable values

  get __type__(): string {
    return this.constructor.name;
  }

  abstract ToString(): JacquesString;
  abstract Equals(other: JacquesValue): JacquesBoolean;
  abstract NotEquals(other: JacquesValue): JacquesBoolean;
}

// ----- Jacques Value Types -----
export class JacquesNumber extends JacquesValue {
  value: number;

  constructor(value: number | string = 0) {
    super();
    this.value = typeof value === "string" ? parseFloat(value) : value;
  }

  Add(other: JacquesNumber): JacquesNumber {
    return new JacquesNumber(this.value + other.value);
  }

  Subtract(other: JacquesNumber): JacquesNumber {
    return new JacquesNumber(this.value - other.value);
  }

  Multiply(other: JacquesNumber): JacquesNumber {
    return new JacquesNumber(this.value * other.value);
  }

  Divide(other: JacquesNumber): JacquesNumber {
    if (other.value === 0) {
      throw new Error("Division by zero");
    }
    return new JacquesNumber(this.value / other.value);
  }

  Modulo(other: JacquesNumber): JacquesNumber {
    return new JacquesNumber(this.value % other.value);
  }

  Equals(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(this.value === other.value);
  }

  NotEquals(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(this.value !== other.value);
  }

  LessThan(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(this.value < other.value);
  }

  GreaterThan(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(this.value > other.value);
  }

  LessThanOrEqual(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(this.value <= other.value);
  }

  GreaterThanOrEqual(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(this.value >= other.value);
  }

  BinaryAnd(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(Boolean(this.value) && Boolean(other.value));
  }

  BinaryOr(other: JacquesNumber): JacquesBoolean {
    return new JacquesBoolean(Boolean(this.value) || Boolean(other.value));
  }

  BinaryNot(): JacquesBoolean {
    return new JacquesBoolean(!Boolean(this.value));
  }

  ToString(): JacquesString {
    return new JacquesString(this.value.toString());
  }
}

export class JacquesString extends JacquesValue {
  value: string;

  constructor(value: string = "") {
    super();
    this.value = value;
  }

  Add(other: JacquesString): JacquesString {
    return new JacquesString(this.value + other.value);
  }

  Equals(other: JacquesString): JacquesBoolean {
    return new JacquesBoolean(this.value === other.value);
  }

  NotEquals(other: JacquesString): JacquesBoolean {
    return new JacquesBoolean(this.value !== other.value);
  }

  ToString(): JacquesString {
    return this;
  }

  ToNumber(): JacquesNumber {
    return new JacquesNumber(parseFloat(this.value));
  }

  ToBoolean(): JacquesBoolean {
    return new JacquesBoolean(this.value.toLowerCase() === "true");
  }
}

export class JacquesBoolean extends JacquesValue {
  value: boolean;

  constructor(value: boolean = false) {
    super();
    this.value = value;
  }

  BinaryAnd(other: JacquesBoolean): JacquesBoolean {
    return new JacquesBoolean(this.value && other.value);
  }

  BinaryOr(other: JacquesBoolean): JacquesBoolean {
    return new JacquesBoolean(this.value || other.value);
  }

  BinaryNot(): JacquesBoolean {
    return new JacquesBoolean(!this.value);
  }

  Equals(other: JacquesBoolean): JacquesBoolean {
    return new JacquesBoolean(this.value === other.value);
  }

  NotEquals(other: JacquesBoolean): JacquesBoolean {
    return new JacquesBoolean(this.value !== other.value);
  }

  ToString(): JacquesString {
    return new JacquesString(this.value.toString());
  }

  ToNumber(): JacquesNumber {
    return new JacquesNumber(this.value ? 1 : 0);
  }
}

export class JacquesRecord extends JacquesValue {
  properties: Record<string, JacquesValue>;
  private proxyHandler: ProxyHandler<JacquesRecord>;

  constructor(properties: Record<string, JacquesValue> = {}) {
    super();
    this.properties = properties;

    // Create a proxy handler to intercept property access
    this.proxyHandler = {
      get: (target: JacquesRecord, prop: string | symbol) => {
        if (typeof prop === "string") {
          // If the property exists in the properties object, return it
          if (prop in target.properties) {
            return target.properties[prop];
          }
        }

        // Otherwise, return the property from the object itself
        return (target as any)[prop];
      },

      has: (target: JacquesRecord, prop: string | symbol) => {
        if (typeof prop === "string") {
          return prop in target.properties || prop in target;
        }
        return prop in target;
      },
    };

    // Return a proxy that intercepts property access
    return new Proxy(this, this.proxyHandler);
  }

  Add(key: JacquesString, value: JacquesValue): JacquesRecord {
    return new JacquesRecord({
      ...this.properties,
      [key.value]: value,
    });
  }

  Remove(key: string): JacquesRecord {
    const newProperties = { ...this.properties };
    delete newProperties[key];
    return new JacquesRecord(newProperties);
  }

  ForEach(callback: (key: JacquesString, value: JacquesValue) => void): void {
    Object.entries(this.properties).forEach(([key, value]) => {
      callback(new JacquesString(key), value);
    });
  }

  Equals(other: JacquesRecord): JacquesBoolean {
    if (
      Object.keys(this.properties).length !==
      Object.keys(other.properties).length
    ) {
      return new JacquesBoolean(false);
    }

    for (const [key, value] of Object.entries(this.properties)) {
      if (other.properties[key] === undefined) {
        return new JacquesBoolean(false);
      }

      if (other.properties[key] instanceof JacquesValue) {
        if (!other.properties[key].Equals(value).value) {
          return new JacquesBoolean(false);
        }
      } else {
        if (other.properties[key] !== value) {
          return new JacquesBoolean(false);
        }
      }
    }

    return new JacquesBoolean(true);
  }

  NotEquals(other: JacquesRecord): JacquesBoolean {
    return this.Equals(other).BinaryNot();
  }

  Get(key: JacquesString): JacquesValue {
    if (key.value in this.properties) {
      return this.properties[key.value];
    }
    throw new Error(`Key not found: ${key.value}`);
  }

  Set(key: JacquesString, value: JacquesValue): JacquesRecord {
    return new JacquesRecord({
      ...this.properties,
      [key.value]: value,
    });
  }

  ContainsKey(key: JacquesString): JacquesBoolean {
    return new JacquesBoolean(key.value in this.properties);
  }

  ContainsValue(value: JacquesValue): JacquesBoolean {
    for (const val of Object.values(this.properties)) {
      if (val instanceof JacquesValue && val.Equals(value).value) {
        return new JacquesBoolean(true);
      }
    }
    return new JacquesBoolean(false);
  }

  get Size(): JacquesNumber {
    return new JacquesNumber(Object.keys(this.properties).length);
  }

  Merge(other: JacquesRecord): JacquesRecord {
    return new JacquesRecord({
      ...this.properties,
      ...other.properties,
    });
  }

  ToJSON(): JacquesString {
    const entries = Object.entries(this.properties).map(([key, value]) => {
      let valueStr;
      if (
        value instanceof JacquesValue &&
        typeof value.ToString === "function"
      ) {
        if (value instanceof JacquesString) {
          valueStr = `"${value.value}"`;
        } else {
          valueStr = value.ToString().value;
        }
      } else {
        valueStr = String(value);
      }
      return `"${key}": ${valueStr}`;
    });
    return new JacquesString(`{ ${entries.join(", ")} }`);
  }

  ToString(): JacquesString {
    const entries = Object.entries(this.properties).map(([key, value]) => {
      let valueStr;
      if (
        value instanceof JacquesValue &&
        typeof value.ToString === "function"
      ) {
        if (value instanceof JacquesString) {
          valueStr = `"${value.value}"`;
        } else {
          valueStr = value.ToString().value;
        }
      } else {
        valueStr = String(value);
      }
      return `${key}: ${valueStr}`;
    });
    return new JacquesString(`{ ${entries.join(", ")} }`);
  }
}

// Return type for function evaluation
export interface ReturnValue {
  __return__: true;
  __value__: JacquesValue | null;
}

export function isReturnValue(value: unknown): value is ReturnValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "__return__" in value &&
    (value as ReturnValue).__return__ === true
  );
}

// Function wrapper class to allow functions to be passed as values
export class JacquesFunction extends JacquesValue {
  private func: Function;
  name: string;
  params: string[] = [];
  // Add metadata that can be used by the interpreter
  __params__?: string[];

  constructor(
    func: Function,
    name: string = "anonymous",
    params: string[] = []
  ) {
    super();
    this.func = func;
    this.name = name;
    this.params = params;
    this.__params__ = params;
  }

  // Call the function with the provided arguments
  __call__(args: JacquesValue[]): JacquesValue | null {
    return this.func(...args) as JacquesValue | null;
  }

  // Bind this function with specific arguments
  Bind(...boundArgs: JacquesValue[]): JacquesFunction {
    const originalFunc = this.func;
    const boundFunc = (...args: JacquesValue[]): JacquesValue | null => {
      // Combine bound arguments with new arguments
      return originalFunc(...boundArgs, ...args) as JacquesValue | null;
    };

    return new JacquesFunction(
      boundFunc,
      `${this.name}_bound`,
      this.params.slice(boundArgs.length)
    );
  }

  // Apply a function to the result of this function (composition)
  Compose(other: JacquesFunction): JacquesFunction {
    const thisFunc = this.func;
    const otherFunc = other.func;

    const composedFunc = (...args: JacquesValue[]): JacquesValue | null => {
      const result = otherFunc(...args);
      if (result instanceof JacquesValue) {
        return thisFunc(result) as JacquesValue | null;
      }
      return null;
    };

    return new JacquesFunction(
      composedFunc,
      `${this.name}_${other.name}_composed`,
      other.params
    );
  }

  // Call this function with an array of arguments
  Apply(argsArray: JacquesArray): JacquesValue | null {
    return this.func(...argsArray.elements) as JacquesValue | null;
  }

  // String representation
  ToString(): JacquesString {
    const paramList =
      this.params.length > 0 ? `(${this.params.join(", ")})` : "()";
    return new JacquesString(`function ${this.name}${paramList}`);
  }

  // Equality checks
  Equals(other: JacquesValue): JacquesBoolean {
    if (other instanceof JacquesFunction) {
      return new JacquesBoolean(this.func === other.func);
    }
    return new JacquesBoolean(false);
  }

  NotEquals(other: JacquesValue): JacquesBoolean {
    return this.Equals(other).BinaryNot();
  }
}

type JacquesClassModifier = "static" | "instance" | "private" | "protected";

type JacquesClassProperty = {
  value: JacquesValue;
  modifier: JacquesClassModifier;
};

type JacquesClassMethod = {
  value: JacquesFunction;
  modifier: JacquesClassModifier;
};

// Class implementation for Jacques
export class JacquesClass extends JacquesValue {
  className: string;
  superClass: JacquesClass | null;
  properties: Record<string, JacquesClassProperty>;
  methods: Record<string, JacquesClassMethod>;
  constructorFunc: JacquesClassMethod | null;

  constructor(
    className: string,
    superClass: JacquesClass | null = null,
    properties: Record<string, JacquesClassProperty> = {},
    methods: Record<string, JacquesClassMethod> = {},
    constructorFunc: JacquesClassMethod | null = null
  ) {
    super();
    this.className = className;
    this.superClass = superClass;

    // Add default static properties
    this.properties = {
      name: { value: new JacquesString(className), modifier: "static" },
      ...properties,
    };

    this.methods = methods;
    this.constructorFunc = constructorFunc;
  }

  // Create a new instance of this class
  __call__(args: JacquesValue[]): JacquesValue {
    // Create a new instance object
    const instance = new JacquesRecord({});

    // Store a reference to the class (for private/protected access)
    (instance as any).__class__ = this;

    // Copy all instance properties to the instance
    for (const [key, value] of Object.entries(this.properties)) {
      instance.properties[key] = value.value;
    }

    // Add methods to the instance as properties
    for (const [key, method] of Object.entries(this.methods)) {
      // Create a bound method with 'this' set to the instance
      const boundMethod = method.value.Bind(instance);
      instance.properties[key] = boundMethod;
    }

    // Add protected methods to the instance
    for (const [key, method] of Object.entries(this.methods)) {
      // Create a bound method with inheritance-aware access check
      const boundMethod = method.value.Bind(instance);
      instance.properties[key] = boundMethod;
    }

    // Call constructor if exists
    if (this.constructorFunc) {
      try {
        this.constructorFunc.value.__call__([instance, ...args]);
      } catch (error) {
        console.error(
          `Error in constructor of class ${this.className}:`,
          error
        );
      }
    }

    return instance;
  }

  DefineProperty(
    name: string,
    value: JacquesValue,
    modifier: "static" | "instance" | "private" | "protected" = "instance"
  ) {
    if (modifier === "static") {
      this.properties[name] = { value, modifier: "static" };
    } else if (modifier === "instance") {
      this.properties[name] = { value, modifier: "instance" };
    } else if (modifier === "private") {
      this.properties[name] = { value, modifier: "private" };
    } else if (modifier === "protected") {
      this.properties[name] = { value, modifier: "protected" };
    }
  }

  DefineMethod(
    name: string,
    method: JacquesFunction,
    modifier: "static" | "instance" | "private" | "protected" = "instance"
  ) {
    if (modifier === "static") {
      this.methods[name] = { value: method, modifier: "static" };
    } else if (modifier === "instance") {
      this.methods[name] = { value: method, modifier: "instance" };
    } else if (modifier === "private") {
      this.methods[name] = { value: method, modifier: "private" };
    } else if (modifier === "protected") {
      this.methods[name] = { value: method, modifier: "protected" };
    }
  }

  // Get a static property
  GetStaticProperty(name: string): JacquesValue | null {
    if (
      name in this.properties &&
      this.properties[name].modifier === "static"
    ) {
      return this.properties[name].value;
    }
    return null;
  }

  // Check if a static property exists
  HasStaticProperty(name: string): boolean {
    return (
      name in this.properties && this.properties[name].modifier === "static"
    );
  }

  // Get a static method
  GetStaticMethod(name: string): JacquesFunction | null {
    if (name in this.methods && this.methods[name].modifier === "static") {
      return this.methods[name].value;
    }
    return null;
  }

  // Check if a static method exists
  HasStaticMethod(name: string): boolean {
    return name in this.methods && this.methods[name].modifier === "static";
  }

  // Get a private method
  GetPrivateMethod(name: string): JacquesFunction | null {
    if (name in this.methods && this.methods[name].modifier === "private") {
      return this.methods[name].value;
    }
    return null;
  }

  // Check if a private method exists
  HasPrivateMethod(name: string): boolean {
    return name in this.methods && this.methods[name].modifier === "private";
  }

  // Get a protected method
  GetProtectedMethod(name: string): JacquesFunction | null {
    if (name in this.methods && this.methods[name].modifier === "protected") {
      return this.methods[name].value;
    }
    return null;
  }

  // Check if a protected method exists
  HasProtectedMethod(name: string): boolean {
    return name in this.methods && this.methods[name].modifier === "protected";
  }

  // String representation
  ToString(): JacquesString {
    return new JacquesString(`Class ${this.className}`);
  }

  // Equality check
  Equals(other: JacquesValue): JacquesBoolean {
    if (other instanceof JacquesClass) {
      return new JacquesBoolean(this.className === other.className);
    }
    return new JacquesBoolean(false);
  }

  NotEquals(other: JacquesValue): JacquesBoolean {
    return this.Equals(other).BinaryNot();
  }
}

// Helper function to add metadata to methods
function addMethodMetadata(
  method: Function,
  name: string,
  params: string[]
): Function {
  const boundMethod = method as any;
  boundMethod.__name__ = name;
  boundMethod.__params__ = params;
  return boundMethod;
}

export class JacquesArray extends JacquesValue {
  constructor(public elements: JacquesValue[] = []) {
    super();

    // Add metadata to methods
    (this.Add as any).__name__ = "Add";
    (this.Add as any).__params__ = ["element"];

    (this.Remove as any).__name__ = "Remove";
    (this.Remove as any).__params__ = ["index"];

    (this.Get as any).__name__ = "Get";
    (this.Get as any).__params__ = ["index"];

    (this.ForEach as any).__name__ = "ForEach";
    (this.ForEach as any).__params__ = ["callback"];

    (this.Map as any).__name__ = "Map";
    (this.Map as any).__params__ = ["callback"];

    (this.Filter as any).__name__ = "Filter";
    (this.Filter as any).__params__ = ["predicate"];

    (this.Contains as any).__name__ = "Contains";
    (this.Contains as any).__params__ = ["value"];

    (this.Reduce as any).__name__ = "Reduce";
    (this.Reduce as any).__params__ = ["initialValue", "callback"];
  }

  // Get a property of the array (e.g., length)
  get Length(): JacquesNumber {
    return new JacquesNumber(this.elements.length);
  }

  // Add an element to the array
  Add(element: JacquesValue): JacquesArray {
    const newElements = [...this.elements, element];
    return new JacquesArray(newElements);
  }

  Get(index: JacquesNumber): JacquesValue {
    if (index.value < 0 || index.value >= this.elements.length) {
      return new JacquesNumber(0); // Return default value for out of bounds
    }
    return this.elements[index.value];
  }

  // Remove an element at the specified index
  Remove(index: JacquesNumber): JacquesArray {
    if (index.value < 0 || index.value >= this.elements.length) {
      return this;
    }
    const newElements = [...this.elements];
    newElements.splice(index.value, 1);
    return new JacquesArray(newElements);
  }

  ForEach(
    callback: (
      element: JacquesValue,
      index: JacquesNumber
    ) => void | JacquesFunction
  ): void {
    this.elements.forEach((element, i) => {
      if (callback instanceof JacquesFunction) {
        callback.__call__([element, new JacquesNumber(i)]);
      } else {
        callback(element, new JacquesNumber(i));
      }
    });
  }

  // Map method for transforming each element with a function
  Map(callback: JacquesFunction): JacquesArray {
    const newElements = this.elements.map((element) => {
      const result = callback.__call__([element]);
      return result instanceof JacquesValue ? result : new JacquesNumber(0);
    });
    return new JacquesArray(newElements);
  }

  // Filter method for selecting elements that match a predicate
  Filter(predicate: JacquesFunction): JacquesArray {
    const newElements = this.elements.filter((element) => {
      const result = predicate.__call__([element]);
      if (result instanceof JacquesBoolean) {
        return result.value;
      }
      return false;
    });
    return new JacquesArray(newElements);
  }

  Equals(other: JacquesArray): JacquesBoolean {
    if (!(other instanceof JacquesArray)) {
      return new JacquesBoolean(false);
    }

    if (this.elements.length !== other.elements.length) {
      return new JacquesBoolean(false);
    }

    for (let i = 0; i < this.elements.length; i++) {
      const thisElement = this.elements[i];
      const otherElement = other.elements[i];

      if (
        thisElement instanceof JacquesValue &&
        otherElement instanceof JacquesValue
      ) {
        if (!thisElement.Equals(otherElement).value) {
          return new JacquesBoolean(false);
        }
      } else if (thisElement !== otherElement) {
        return new JacquesBoolean(false);
      }
    }

    return new JacquesBoolean(true);
  }

  NotEquals(other: JacquesArray): JacquesBoolean {
    return this.Equals(other).BinaryNot();
  }

  Contains(value: JacquesValue): JacquesBoolean {
    if (!value) {
      return new JacquesBoolean(false);
    }

    for (const element of this.elements) {
      if (element.Equals(value).value) {
        return new JacquesBoolean(true);
      }
    }
    return new JacquesBoolean(false);
  }

  // Reduce method for aggregating array values
  Reduce(initialValue: JacquesValue, callback: JacquesFunction): JacquesValue {
    let accumulator = initialValue;

    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      accumulator = callback.__call__([accumulator, element]) as JacquesValue;
    }

    return accumulator;
  }

  ToString(): JacquesString {
    const elements = this.elements.map((element) => {
      if (element instanceof JacquesValue) {
        return element.ToString().value;
      }
      return String(element);
    });
    return new JacquesString(`[${elements.join(", ")}]`);
  }
}
