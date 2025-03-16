import { JacquesValue } from "./JacquesValue";

export type EnvironmentRecord = Record<string, JacquesValue>;

// Ensure the class is exported
export class Environment {
  private values: Map<string, JacquesValue>;
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.values = new Map();
    this.parent = parent;
  }

  // Define a new variable in the current scope
  define(name: string, value: JacquesValue): void {
    this.values.set(name, value);
  }

  // Assign to a variable in this scope or parent scopes
  assign(name: string, value: JacquesValue): JacquesValue {
    // Check if the variable exists in the current scope
    if (this.values.has(name)) {
      // Check if the value is constant
      const existingValue = this.values.get(name);
      if (existingValue instanceof JacquesValue && existingValue.__constant__) {
        throw new Error(`Cannot reassign constant variable: ${name}`);
      }
      this.values.set(name, value);
      return value;
    }

    // If not found in current scope, try to assign in parent scope
    if (this.parent) {
      return this.parent.assign(name, value);
    }

    // If the variable doesn't exist anywhere in the scope chain, define it here
    this.define(name, value);
    return value;
  }

  // Get a variable from this scope or parent scopes
  get(name: string): JacquesValue {
    // Check if the variable exists in the current scope
    if (this.values.has(name)) {
      return this.values.get(name)!;
    }

    // If not found in current scope, look in parent scope
    if (this.parent) {
      return this.parent.get(name);
    }

    throw new Error(`Undefined variable: ${name}`);
  }

  // Check if a variable exists in this scope or parent scopes
  has(name: string): boolean {
    if (this.values.has(name)) {
      return true;
    }

    if (this.parent) {
      return this.parent.has(name);
    }

    return false;
  }

  // Get all variables in the current scope
  getAll(): EnvironmentRecord {
    const result: EnvironmentRecord = {};

    // Add variables from parent scope first (so they can be overridden)
    if (this.parent) {
      Object.assign(result, this.parent.getAll());
    }

    // Add variables from current scope
    this.values.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }
}
