import { JacquesValue } from "./JacquesValue";

export interface StoredValue {
  value: JacquesValue;
  constantBinding: boolean;
}

export type EnvironmentRecord = Record<string, JacquesValue>;

// Ensure the class is exported
export class Environment {
  private values: Map<string, StoredValue>;

  constructor(public enclosing: Environment | null = null) {
    this.values = new Map();
  }

  // Define a new variable in the current scope with explicit constant flag
  define(name: string, value: JacquesValue, constantBinding: boolean): void {
    this.values.set(name, { value, constantBinding });
  }

  // Assign to a variable in this scope or parent scopes
  assign(name: string, value: JacquesValue): JacquesValue {
    if (this.values.has(name)) {
      // We know the value exists because we just checked with has()
      const storedValue = this.values.get(name);
      // This should never happen, but TypeScript doesn't know that
      if (!storedValue) {
        throw new Error(`Internal error: value for ${name} disappeared`);
      }

      if (storedValue.constantBinding) {
        throw new Error(`Cannot reassign constant variable: ${name}`);
      }

      this.values.set(name, { ...storedValue, value });
      return value;
    }

    if (this.enclosing !== null) {
      return this.enclosing.assign(name, value);
    }

    throw new Error(`Undefined variable '${name}'`);
  }

  // Get a variable from this scope or parent scopes
  get(name: string): JacquesValue {
    const value = this.values.get(name);

    if (value !== undefined) {
      return value.value;
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new Error(`Undefined variable '${name}'`);
  }

  // Get a variable with its constant status
  getWithConstantInfo(
    name: string
  ): { value: JacquesValue; constantBinding: boolean } | null {
    const value = this.values.get(name);

    if (value !== undefined) {
      return { value: value.value, constantBinding: value.constantBinding };
    }

    if (this.enclosing !== null) {
      return this.enclosing.getWithConstantInfo(name);
    }

    return null; // Return null instead of throwing an error
  }

  // Check if a variable exists in this scope or parent scopes
  has(name: string): boolean {
    if (this.values.has(name)) {
      return true;
    }

    if (this.enclosing) {
      return this.enclosing.has(name);
    }

    return false;
  }

  // Get all variables in the current scope
  getAll(): EnvironmentRecord {
    const result: EnvironmentRecord = {};

    // Add variables from parent scope first (so they can be overridden)
    if (this.enclosing) {
      Object.assign(result, this.enclosing.getAll());
    }

    // Add variables from current scope
    this.values.forEach((storedValue, key) => {
      result[key] = storedValue.value;
    });

    return result;
  }
}
