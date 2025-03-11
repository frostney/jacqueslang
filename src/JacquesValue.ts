// Abstract class for instanceof checks
export abstract class JacquesValue /* implements JacquesValue */ {
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
}

export class JacquesArray extends JacquesValue {
  elements: JacquesValue[];

  constructor(elements: JacquesValue[] = []) {
    super();
    this.elements = elements;
  }

  // Get a property of the array (e.g., length)
  get length(): number {
    return this.elements.length;
  }

  // Add an element to the array
  Add(element: JacquesValue): JacquesArray {
    const newElements = [...this.elements, element];
    return new JacquesArray(newElements);
  }

  // Add an element to the end of the array (alias for Add to match standard arrays)
  push(element: JacquesValue): JacquesArray {
    return this.Add(element);
  }

  // Remove an element at the specified index
  Remove(index: number): JacquesArray {
    if (index < 0 || index >= this.elements.length) {
      return this;
    }
    const newElements = [...this.elements];
    newElements.splice(index, 1);
    return new JacquesArray(newElements);
  }

  // Get an element at the specified index
  Get(index: number): JacquesValue {
    if (index < 0 || index >= this.elements.length) {
      return new JacquesNumber(0); // Return default value for out of bounds
    }
    return this.elements[index];
  }

  ForEach(
    callback: (element: JacquesValue, index: JacquesNumber) => void
  ): void {
    this.elements.forEach((element, i) => {
      callback(element, new JacquesNumber(i));
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

export class JacquesMap extends JacquesValue {
  properties: Record<string, JacquesValue>;

  constructor(properties: Record<string, JacquesValue> = {}) {
    super();
    this.properties = properties;
  }

  Add(key: string, value: JacquesValue): JacquesMap {
    return new JacquesMap({
      ...this.properties,
      [key]: value,
    });
  }

  Remove(key: string): JacquesMap {
    const newProperties = { ...this.properties };
    delete newProperties[key];
    return new JacquesMap(newProperties);
  }

  ForEach(callback: (key: JacquesString, value: JacquesValue) => void): void {
    Object.entries(this.properties).forEach(([key, value]) => {
      callback(new JacquesString(key), value);
    });
  }

  Equals(other: JacquesMap): JacquesBoolean {
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
        if (!other.properties[key].Equals(value)) {
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

  NotEquals(other: JacquesMap): JacquesBoolean {
    return this.Equals(other).BinaryNot();
  }

  ToString(): JacquesString {
    const jsonObj: Record<string, unknown> = {};
    Object.entries(this.properties).forEach(([key, value]) => {
      if (value instanceof JacquesString) {
        jsonObj[key] = value.value;
      } else if (value instanceof JacquesNumber) {
        jsonObj[key] = value.value;
      } else if (value instanceof JacquesBoolean) {
        jsonObj[key] = value.value;
      } else {
        jsonObj[key] = value;
      }
    });
    return new JacquesString(JSON.stringify(jsonObj));
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

  constructor(
    func: Function,
    name: string = "anonymous",
    params: string[] = []
  ) {
    super();
    this.func = func;
    this.name = name;
    this.params = params;
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
