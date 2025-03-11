import type {
  ProgramNode,
  ASTNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  IdentifierNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  AssignmentNode,
  ArrayLiteralNode,
  ObjectLiteralNode,
  MemberExpressionNode,
  CallExpressionNode,
  FunctionDeclarationNode,
  LambdaExpressionNode,
  ClassDeclarationNode,
  IfStatementNode,
  ReturnStatementNode,
  ImportDeclarationNode,
  ExportDeclarationNode,
  MethodDefinitionNode,
  WhileStatementNode,
} from "./ASTNode";
import {
  JacquesValue,
  JacquesArray,
  JacquesNumber,
  JacquesString,
  JacquesBoolean,
  JacquesMap,
  JacquesFunction,
  isReturnValue,
} from "./JacquesValue";
import type { ReturnValue } from "./JacquesValue";
import {
  isIdentifierNode,
  isMemberExpressionNode,
  isMethodDefinitionNode,
  isPropertyDefinitionNode,
} from "./ASTNode";

import { Lexer } from "./Lexer";
import { Parser } from "./Parser";

// Environment type for variables and functions
export type Environment = Record<string, JacquesValue | Function>;

// ----- Interpreter -----
export class Interpreter {
  private ast: ProgramNode;
  private env: Environment = {};
  private builtins: Environment = {};

  public get environment() {
    return this.env;
  }

  constructor(ast: ProgramNode) {
    this.ast = ast;
    this.initializeBuiltins();
  }

  private initializeBuiltins(): void {
    // Built-in functions
    this.builtins.Println = (...args: JacquesValue[]): null => {
      console.log(...args.map((arg) => arg.ToString().value));
      return null;
    };

    // Built-in constructors
    this.builtins.Number = (value: unknown = 0): JacquesNumber => {
      if (typeof value === "number") {
        return new JacquesNumber(value);
      } else if (typeof value === "string") {
        return new JacquesNumber(parseFloat(value));
      } else if (value instanceof JacquesNumber) {
        return new JacquesNumber(value.value);
      } else {
        return new JacquesNumber(0);
      }
    };

    this.builtins.String = (value: unknown = ""): JacquesString => {
      if (value instanceof JacquesValue) {
        return value.ToString();
      }
      return new JacquesString(String(value));
    };

    this.builtins.Boolean = (value: unknown = false): JacquesBoolean => {
      return new JacquesBoolean(Boolean(value));
    };

    this.builtins.Array = (...elements: JacquesValue[]): JacquesArray => {
      return new JacquesArray(elements);
    };

    this.builtins.Map = (
      properties: Record<string, JacquesValue> = {}
    ): JacquesMap => {
      return new JacquesMap(properties);
    };
  }

  private evaluate(
    node: ASTNode,
    env: Environment = this.env
  ): JacquesValue | Function | ReturnValue | null {
    switch (node.type) {
      case "Program":
        return this.evaluateProgram(node as ProgramNode, env);
      case "NumberLiteral":
        return new JacquesNumber((node as NumberLiteralNode).value);
      case "StringLiteral":
        return new JacquesString((node as StringLiteralNode).value);
      case "BooleanLiteral":
        return new JacquesBoolean((node as BooleanLiteralNode).value);
      case "Identifier":
        return this.evaluateIdentifier(node as IdentifierNode, env);
      case "BinaryExpression":
        return this.evaluateBinaryExpression(node as BinaryExpressionNode, env);
      case "UnaryExpression":
        return this.evaluateUnaryExpression(node as UnaryExpressionNode, env);
      case "Assignment":
        return this.evaluateAssignment(node as AssignmentNode, env);
      case "ArrayLiteral":
        return this.evaluateArrayLiteral(node as ArrayLiteralNode, env);
      case "ObjectLiteral":
        return this.evaluateObjectLiteral(node as ObjectLiteralNode, env);
      case "MemberExpression":
        return this.evaluateMemberExpression(node as MemberExpressionNode, env);
      case "CallExpression":
        return this.evaluateCallExpression(node as CallExpressionNode, env);
      case "FunctionDeclaration":
        return this.evaluateFunctionDeclaration(
          node as FunctionDeclarationNode,
          env
        );
      case "LambdaExpression":
        return this.evaluateLambdaExpression(node as LambdaExpressionNode, env);
      case "ClassDeclaration":
        return this.evaluateClassDeclaration(node as ClassDeclarationNode, env);
      case "IfStatement":
        return this.evaluateIfStatement(node as IfStatementNode, env);
      case "ReturnStatement":
        return this.evaluateReturnStatement(node as ReturnStatementNode, env);
      case "ImportDeclaration":
        return this.evaluateImportDeclaration(
          node as ImportDeclarationNode,
          env
        );
      case "ExportDeclaration":
        return this.evaluateExportDeclaration(
          node as ExportDeclarationNode,
          env
        );
      case "WhileStatement":
        return this.evaluateWhileStatement(node as WhileStatementNode, env);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  // Evaluators for each node type
  private evaluateProgram(
    node: ProgramNode,
    env: Environment
  ): JacquesValue | null {
    let result: JacquesValue | Function | ReturnValue | null = null;

    for (const statement of node.body) {
      result = this.evaluate(statement, env);

      if (isReturnValue(result)) {
        return result.__value__;
      }
    }

    if (result instanceof JacquesValue) {
      return result;
    }

    return null;
  }

  private evaluateIdentifier(
    node: IdentifierNode,
    env: Environment
  ): JacquesValue | Function {
    const name = node.name;

    // Check if this is an instance property reference with @ prefix
    if (name.startsWith("@")) {
      const propName = name.substring(1); // Remove the @ prefix

      // Look for 'self' in the environment
      if ("self" in env) {
        const self = env["self"] as unknown as Record<string, JacquesValue>;
        if (propName in self) {
          return self[propName];
        }
      }

      throw new Error(`Undefined instance property: ${propName}`);
    }

    if (name in env) {
      return env[name];
    }

    if (name in this.builtins) {
      return this.builtins[name];
    }

    throw new Error(`Undefined variable: ${name}`);
  }

  private evaluateBinaryExpression(
    node: BinaryExpressionNode,
    env: Environment
  ): JacquesValue {
    const leftResult = this.evaluate(node.left, env);
    const rightResult = this.evaluate(node.right, env);

    if (
      !(leftResult instanceof JacquesValue) ||
      !(rightResult instanceof JacquesValue)
    ) {
      throw new Error(
        `Invalid operands for binary expression: ${node.operator}`
      );
    }

    const left = leftResult;
    const right = rightResult;

    switch (node.operator) {
      case "+":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Add(right);
        } else if (
          left instanceof JacquesString ||
          right instanceof JacquesString
        ) {
          // Convert both operands to strings and concatenate
          return new JacquesString(
            left.ToString().value + right.ToString().value
          );
        }
        throw new Error(`Incompatible types for operator +`);
      case "-":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Subtract(right);
        }
        throw new Error(`Incompatible types for operator -`);
      case "*":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Multiply(right);
        }
        throw new Error(`Incompatible types for operator *`);
      case "/":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Divide(right);
        }
        throw new Error(`Incompatible types for operator /`);
      case "%":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Modulo(right);
        }
        throw new Error(`Incompatible types for operator %`);
      case "==":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Equals(right);
        } else if (
          left instanceof JacquesString &&
          right instanceof JacquesString
        ) {
          return left.Equals(right);
        } else if (
          left instanceof JacquesBoolean &&
          right instanceof JacquesBoolean
        ) {
          return left.Equals(right);
        }
        return new JacquesBoolean(false);
      case "!=":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.NotEquals(right);
        } else if (
          left instanceof JacquesString &&
          right instanceof JacquesString
        ) {
          return left.NotEquals(right);
        } else if (
          left instanceof JacquesBoolean &&
          right instanceof JacquesBoolean
        ) {
          return left.NotEquals(right);
        }
        return new JacquesBoolean(true);
      case "<":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.LessThan(right);
        }
        throw new Error(`Incompatible types for operator <`);
      case ">":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.GreaterThan(right);
        }
        throw new Error(`Incompatible types for operator >`);
      case "<=":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.LessThanOrEqual(right);
        }
        throw new Error(`Incompatible types for operator <=`);
      case ">=":
        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.GreaterThanOrEqual(right);
        }
        throw new Error(`Incompatible types for operator >=`);
      case "&&":
        if (left instanceof JacquesBoolean && right instanceof JacquesBoolean) {
          return left.BinaryAnd(right);
        } else if (
          left instanceof JacquesNumber &&
          right instanceof JacquesNumber
        ) {
          return left.BinaryAnd(right);
        }
        throw new Error(`Incompatible types for operator &&`);
      case "||":
        if (left instanceof JacquesBoolean && right instanceof JacquesBoolean) {
          return left.BinaryOr(right);
        } else if (
          left instanceof JacquesNumber &&
          right instanceof JacquesNumber
        ) {
          return left.BinaryOr(right);
        }
        throw new Error(`Incompatible types for operator ||`);
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  private evaluateUnaryExpression(
    node: UnaryExpressionNode,
    env: Environment
  ): JacquesValue {
    const argResult = this.evaluate(node.argument, env);

    if (!(argResult instanceof JacquesValue)) {
      throw new Error(`Invalid operand for unary expression: ${node.operator}`);
    }

    const argument = argResult;

    switch (node.operator) {
      case "!":
        if (argument instanceof JacquesBoolean) {
          return argument.BinaryNot();
        } else if (argument instanceof JacquesNumber) {
          return argument.BinaryNot();
        }
        throw new Error(`Incompatible type for operator !`);
      case "-":
        if (argument instanceof JacquesNumber) {
          return new JacquesNumber(-argument.value);
        }
        throw new Error(`Incompatible type for operator -`);
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  private evaluateAssignment(
    node: AssignmentNode,
    env: Environment
  ): JacquesValue | Function {
    if (isIdentifierNode(node.left)) {
      const name = node.left.name;

      // Check if this is an instance property assignment with @ prefix
      if (name.startsWith("@")) {
        const propName = name.substring(1); // Remove the @ prefix

        // Look for 'self' in the environment
        if ("self" in env) {
          const self = env["self"] as unknown as Record<string, JacquesValue>;

          const valueResult = this.evaluate(node.right, env);

          // Allow only JacquesValue types for instance properties
          if (!(valueResult instanceof JacquesValue)) {
            throw new Error(
              `Cannot assign non-value to instance property: ${propName}`
            );
          }

          // Set constant flag
          valueResult.__constant__ = node.isConstant;

          // Assign to instance property
          self[propName] = valueResult;
          return valueResult;
        }

        throw new Error(`Cannot use @ prefix outside of a class method`);
      }

      // Regular variable assignment
      // Check if we're trying to reassign a constant
      if (
        name in env &&
        env[name] instanceof JacquesValue &&
        (env[name] as JacquesValue).__constant__
      ) {
        throw new Error(`Cannot reassign constant variable: ${name}`);
      }

      const valueResult = this.evaluate(node.right, env);

      // Allow both JacquesValue and Function types
      if (
        !(valueResult instanceof JacquesValue) &&
        typeof valueResult !== "function"
      ) {
        throw new Error(
          `Cannot assign non-value or non-function to variable: ${name}`
        );
      }

      // Set constant flag if it's a JacquesValue
      if (valueResult instanceof JacquesValue) {
        valueResult.__constant__ = node.isConstant;
      }

      env[name] = valueResult;
      return valueResult;
    } else if (isMemberExpressionNode(node.left)) {
      const memberExpr = node.left;
      const objectResult = this.evaluate(memberExpr.object, env);

      // Special handling for self
      if (
        isIdentifierNode(memberExpr.object) &&
        memberExpr.object.name === "self"
      ) {
        if (!("self" in env)) {
          throw new Error("Cannot use self outside of a class method");
        }

        const self = env.self as JacquesMap;
        const property = isIdentifierNode(memberExpr.property)
          ? memberExpr.property.name
          : (this.evaluate(memberExpr.property, env) as JacquesValue).ToString()
              .value;

        const valueResult = this.evaluate(node.right, env);

        if (!(valueResult instanceof JacquesValue)) {
          throw new Error(`Cannot assign non-value to property: ${property}`);
        }

        // Set constant flag
        valueResult.__constant__ = node.isConstant;

        // Assign to property
        self.properties[property] = valueResult;

        return valueResult;
      }

      // Handle function properties
      if (objectResult instanceof JacquesFunction) {
        const property = isIdentifierNode(memberExpr.property)
          ? memberExpr.property.name
          : (this.evaluate(memberExpr.property, env) as JacquesValue).ToString()
              .value;

        const valueResult = this.evaluate(node.right, env);

        if (!(valueResult instanceof JacquesValue)) {
          throw new Error(`Cannot assign non-value to property: ${property}`);
        }

        // Create a property on the function
        (objectResult as any)[property] = valueResult;
        return valueResult;
      }

      // Handle map and array properties
      if (
        !(objectResult instanceof JacquesMap) &&
        !(objectResult instanceof JacquesArray)
      ) {
        throw new Error(`Cannot assign to property of non-object type`);
      }

      const object = objectResult;

      if (memberExpr.computed) {
        const propertyResult = this.evaluate(memberExpr.property, env);

        if (!(propertyResult instanceof JacquesValue)) {
          throw new Error(`Invalid property accessor`);
        }

        const property = propertyResult.ToString().value;
        const valueResult = this.evaluate(node.right, env);

        if (!(valueResult instanceof JacquesValue)) {
          throw new Error(`Cannot assign non-value to property: ${property}`);
        }

        if (object instanceof JacquesMap) {
          object.properties[property] = valueResult;
          return valueResult;
        } else if (object instanceof JacquesArray) {
          const index = parseInt(property, 10);
          if (isNaN(index)) {
            throw new Error(`Invalid array index: ${property}`);
          }
          object.elements[index] = valueResult;
          return valueResult;
        }
      } else if (isIdentifierNode(memberExpr.property)) {
        const property = memberExpr.property.name;
        const valueResult = this.evaluate(node.right, env);

        if (!(valueResult instanceof JacquesValue)) {
          throw new Error(`Cannot assign non-value to property: ${property}`);
        }

        if (object instanceof JacquesMap) {
          object.properties[property] = valueResult;
          return valueResult;
        }
      }
    }

    throw new Error(`Invalid property access`);
  }

  private evaluateArrayLiteral(
    node: ArrayLiteralNode,
    env: Environment
  ): JacquesArray {
    const elementsResults = node.elements.map((element) =>
      this.evaluate(element, env)
    );
    const elements: JacquesValue[] = [];

    for (const result of elementsResults) {
      if (!(result instanceof JacquesValue)) {
        throw new Error(`Array can only contain Jacques values`);
      }
      elements.push(result);
    }

    return new JacquesArray(elements);
  }

  private evaluateObjectLiteral(
    node: ObjectLiteralNode,
    env: Environment
  ): JacquesMap {
    const properties: Record<string, JacquesValue> = {};

    for (const { key, value } of node.properties) {
      const valueResult = this.evaluate(value, env);

      if (!(valueResult instanceof JacquesValue)) {
        throw new Error(`Object property values must be Jacques values`);
      }

      properties[key] = valueResult;
    }

    return new JacquesMap(properties);
  }

  private evaluateMemberExpression(
    node: MemberExpressionNode,
    env: Environment
  ): JacquesValue | Function {
    // Get the object
    const object = this.evaluate(node.object, env);

    // Get the property
    let property;
    if (node.computed) {
      // Computed property access: obj[expr]
      property = this.evaluate(node.property, env);
    } else {
      // Direct property access: obj.prop
      if (isIdentifierNode(node.property)) {
        property = node.property.name;
      } else {
        throw new Error("Property must be an identifier");
      }
    }

    // Handle different object types
    if (object instanceof JacquesArray) {
      // Handle array specific methods and properties
      if (typeof property === "string") {
        if (property === "length") {
          return new JacquesNumber(object.length);
        } else if (property === "push" || property === "Add") {
          return new JacquesFunction(
            (element: JacquesValue) => object.Add(element),
            "push",
            ["element"]
          );
        } else if (property === "Get") {
          return new JacquesFunction(
            (index: JacquesNumber) => object.Get(index.value),
            "Get",
            ["index"]
          );
        } else if (property === "Remove") {
          return new JacquesFunction(
            (index: JacquesNumber) => object.Remove(index.value),
            "Remove",
            ["index"]
          );
        } else if (property === "Map") {
          return new JacquesFunction(
            (callback: JacquesFunction) => object.Map(callback),
            "Map",
            ["callback"]
          );
        } else if (property === "Filter") {
          return new JacquesFunction(
            (predicate: JacquesFunction) => object.Filter(predicate),
            "Filter",
            ["predicate"]
          );
        } else if (property === "forEach" || property === "ForEach") {
          return new JacquesFunction(
            (callback: Function) => {
              object.ForEach((element, index) => {
                if (callback instanceof JacquesFunction) {
                  callback.__call__([element, index]);
                } else {
                  callback(element, index);
                }
              });
              return object;
            },
            "ForEach",
            ["callback"]
          );
        }
      } else if (property instanceof JacquesNumber) {
        // Handle array index access
        const index = property.value;
        if (index >= 0 && index < object.elements.length) {
          return object.elements[index];
        }
        return new JacquesNumber(0); // Return default for out of bounds
      }
    } else if (object instanceof JacquesMap) {
      // Handle object property access
      if (typeof property === "string") {
        if (property in object.properties) {
          return object.properties[property];
        }
      }
    } else if (object instanceof JacquesFunction) {
      // Handle function methods like Bind, Apply, Compose
      if (typeof property === "string") {
        if (property === "Bind") {
          return new JacquesFunction(
            (...args: JacquesValue[]) => object.Bind(...args),
            "Bind",
            ["...args"]
          );
        } else if (property === "Apply") {
          return new JacquesFunction(
            (argsArray: JacquesArray) => object.Apply(argsArray),
            "Apply",
            ["argsArray"]
          );
        } else if (property === "Compose") {
          return new JacquesFunction(
            (other: JacquesFunction) => object.Compose(other),
            "Compose",
            ["otherFunction"]
          );
        } else if (property === "name") {
          return new JacquesString(object.name);
        }
      }
    } else if (object instanceof JacquesString) {
      // Handle string properties
      if (typeof property === "string") {
        if (property === "length") {
          return new JacquesNumber(object.value.length);
        }
      } else if (property instanceof JacquesNumber) {
        // Handle string index access
        const index = property.value;
        if (index >= 0 && index < object.value.length) {
          return new JacquesString(object.value[index]);
        }
        return new JacquesString(""); // Empty string for out of bounds
      }
    }

    // For any other object type
    if (typeof object === "object" && object !== null) {
      const objAsAny = object as any;

      // Check if the property exists on the object
      if (typeof property === "string" && property in objAsAny) {
        const value = objAsAny[property];

        // Handle method calls (wrap functions)
        if (typeof value === "function") {
          // This is a method, create a bound function
          return new JacquesFunction(
            (...args: unknown[]) => value.apply(object, args),
            property
          );
        }

        // Return the property value
        return value instanceof JacquesValue
          ? value
          : new JacquesString(String(value));
      }
    }

    throw new Error(`Property ${String(property)} not found on object`);
  }

  private evaluateCallExpression(
    node: CallExpressionNode,
    env: Environment
  ): JacquesValue | null {
    const calleeResult = this.evaluate(node.callee, env);

    // Convert arguments to JacquesValues
    const argsResults = node.arguments.map((arg) =>
      this.evaluate(arg, env)
    ) as JacquesValue[];

    // Check if this is a JacquesFunction
    if (calleeResult instanceof JacquesFunction) {
      return calleeResult.__call__(argsResults);
    }

    // Check for other types with __call__ method
    if (calleeResult instanceof JacquesValue && calleeResult.__call__) {
      return calleeResult.__call__(argsResults);
    }

    // Check if this is a regular JavaScript function
    if (typeof calleeResult === "function") {
      const func = calleeResult;

      // Check if this is a class constructor call
      if (func.prototype && func.prototype.constructor === func) {
        // Call with 'new' operator
        return new (func as any)(...argsResults);
      }

      // Regular function call
      return func(...argsResults) as JacquesValue | null;
    }

    // Not a callable value
    throw new Error(`${String(calleeResult)} is not a function`);
  }

  private evaluateFunctionDeclaration(
    node: FunctionDeclarationNode,
    env: Environment
  ): Function | JacquesFunction {
    const func = (...args: unknown[]): JacquesValue | null => {
      const functionEnv: Environment = { ...env, ...this.builtins };

      // Bind parameters to arguments
      for (let i = 0; i < node.params.length; i++) {
        const param = node.params[i];
        let argValue: JacquesValue;

        if (i < args.length && args[i] instanceof JacquesValue) {
          // Use provided argument
          argValue = args[i] as JacquesValue;
        } else if (param.defaultValue) {
          // Use default value if available
          argValue = this.evaluate(
            param.defaultValue,
            functionEnv
          ) as JacquesValue;
        } else {
          // Otherwise use a default value of 0
          argValue = new JacquesNumber(0);
        }

        functionEnv[param.name] = argValue;
      }

      // Set up Result variable
      functionEnv.Result = new JacquesNumber(0);

      // Execute function body
      for (const statement of node.body) {
        const result = this.evaluate(statement, functionEnv);

        if (isReturnValue(result)) {
          return result.__value__;
        }
      }

      return functionEnv.Result as JacquesValue;
    };

    // Extract parameter names
    const paramNames = node.params.map((param) => param.name);

    // Create a JacquesFunction wrapper
    const functionName = node.name ? node.name.name : "anonymous";
    const jacquesFunc = new JacquesFunction(func, functionName, paramNames);

    // If the function has a name, add it to the environment
    if (node.name !== null) {
      env[node.name.name] = jacquesFunc;
    }

    return jacquesFunc;
  }

  private evaluateLambdaExpression(
    node: LambdaExpressionNode,
    env: Environment
  ): Function | JacquesFunction {
    const lambdaFunc = (...args: unknown[]): JacquesValue | null => {
      const lambdaEnv: Environment = { ...env, ...this.builtins };

      // Bind parameters to arguments
      for (let i = 0; i < node.params.length; i++) {
        const param = node.params[i];
        let argValue: JacquesValue;

        if (i < args.length && args[i] instanceof JacquesValue) {
          // Use provided argument
          argValue = args[i] as JacquesValue;
        } else if (param.defaultValue) {
          // Use default value if available
          argValue = this.evaluate(
            param.defaultValue,
            lambdaEnv
          ) as JacquesValue;
        } else {
          // Otherwise use a default value of 0
          argValue = new JacquesNumber(0);
        }

        lambdaEnv[param.name] = argValue;
      }

      const result = this.evaluate(node.body, lambdaEnv);

      if (result instanceof JacquesValue) {
        return result;
      }

      return null;
    };

    // Extract parameter names
    const paramNames = node.params.map((param) => param.name);

    // Create a JacquesFunction wrapper with parameter names
    return new JacquesFunction(lambdaFunc, "lambda", paramNames);
  }

  private evaluateClassDeclaration(
    node: ClassDeclarationNode,
    env: Environment
  ): Function {
    // Store reference to the interpreter
    const interpreter = this;

    // Create a constructor function that will be both the class and instance constructor
    const classConstructor = function (
      this: Record<string, unknown>,
      ...args: unknown[]
    ): JacquesValue {
      // If called without 'new', we can't access 'this'
      if (!(this instanceof Object)) {
        throw new Error(`Class constructor must be called with 'new'`);
      }

      // Handle extends (inheritance)
      if (node.superClass !== null && superClassConstructor) {
        Object.setPrototypeOf(
          this,
          Object.create((superClassConstructor as Function).prototype)
        );
      }

      // Initialize instance properties
      for (const prop of node.body) {
        if (isPropertyDefinitionNode(prop) && !prop.isStatic) {
          const propDef = prop;
          if (propDef.value) {
            const value = interpreter.evaluate(propDef.value, env);
            if (value instanceof JacquesValue) {
              this[propDef.name.name] = value;
            } else {
              this[propDef.name.name] = new JacquesNumber(0);
            }
          } else {
            this[propDef.name.name] = new JacquesNumber(0);
          }
        }
      }

      // Create a JacquesMap to wrap the instance
      const instanceMap = new JacquesMap();

      // Copy all properties from this to the map
      for (const key in this) {
        if (Object.prototype.hasOwnProperty.call(this, key)) {
          const value = this[key];
          if (value instanceof JacquesValue) {
            instanceMap.properties[key] = value;
          } else if (typeof value === "function") {
            // Skip functions
          } else {
            instanceMap.properties[key] = new JacquesNumber(0);
          }
        }
      }

      // Copy all methods from this to the map
      for (const prop of node.body) {
        if (isMethodDefinitionNode(prop) && !prop.isConstructor) {
          const methodName = prop.name.name;
          const methodFunc = this[methodName] as Function;

          // Create a wrapper function that includes instance properties in the environment
          instanceMap.properties[methodName] = function (...args: unknown[]) {
            // Create a method environment with access to instance properties
            const methodEnv: Environment = { ...env, ...interpreter.builtins };

            // Add all instance properties to the environment
            for (const key in instanceMap.properties) {
              if (key !== methodName) {
                methodEnv[key] = instanceMap.properties[key];
              }
            }

            // Add self reference
            methodEnv.self = instanceMap;

            // Execute the method with the proper environment
            const body = prop.function.body;

            // Handle array of statements
            if (Array.isArray(body)) {
              // Execute each statement in the body
              let result: JacquesValue | Function | ReturnValue | null = null;
              for (const statement of body) {
                result = interpreter.evaluate(statement, methodEnv);
                if (isReturnValue(result)) {
                  return result.__value__;
                }
              }
              return result;
            } else {
              // Handle single expression
              return interpreter.evaluate(body, methodEnv);
            }
          } as unknown as JacquesValue;
        }
      }

      // Call constructor if it exists
      const constructorDef = node.body.find(
        (member) => isMethodDefinitionNode(member) && member.isConstructor
      ) as MethodDefinitionNode | undefined;

      if (constructorDef) {
        // Create a constructor environment with self reference
        const constructorEnv: Environment = {
          ...Object.assign({}, env),
          ...Object.assign({}, this.builtins),
          // Add self reference to the instance
          self: instanceMap,
        };

        const constructorFunc = interpreter.evaluate(
          constructorDef.function,
          constructorEnv
        );

        if (typeof constructorFunc === "function") {
          // Process constructor arguments
          const constructorParams = constructorDef.function.params;

          // Handle shorthand properties in constructor parameters
          for (
            let i = 0;
            i < constructorParams.length && i < args.length;
            i++
          ) {
            const param = constructorParams[i];
            if (param.isShorthandProperty) {
              // Automatically assign parameter value to instance property
              instanceMap.properties[param.name] = args[i] as JacquesValue;
            }
          }

          // Call the constructor function with the instance as 'this'
          constructorFunc.apply(null, args);
        }
      }

      return instanceMap;
    };

    // Handle extends (inheritance)
    let superClassConstructor: Function | null = null;
    if (node.superClass !== null) {
      const evalResult = this.evaluate(node.superClass, env);
      if (typeof evalResult === "function") {
        superClassConstructor = evalResult;
      } else {
        throw new Error(`Cannot extend non-class type`);
      }
    }

    // Add instance methods
    for (const member of node.body) {
      if (
        isMethodDefinitionNode(member) &&
        !member.isStatic &&
        !member.isConstructor
      ) {
        const methodDef = member;
        const name = methodDef.name.name;

        // Add method to prototype
        classConstructor.prototype[name] = function (
          this: Record<string, unknown>,
          ...args: unknown[]
        ): JacquesValue | null {
          const method = interpreter.evaluate(methodDef.function, {
            ...env,
            self: this as unknown as JacquesValue,
          });

          if (typeof method === "function") {
            return method.apply(this, args);
          }

          return null;
        };
      }
    }

    // Add static methods and properties
    for (const member of node.body) {
      if (isMethodDefinitionNode(member) && member.isStatic) {
        const methodDef = member;
        const methodName = methodDef.name.name;

        const staticFunc = interpreter.evaluate(methodDef.function, {
          ...env,
          self: classConstructor as unknown as JacquesValue,
        });

        if (typeof staticFunc === "function") {
          Object.defineProperty(classConstructor, methodName, {
            value: staticFunc,
            writable: true,
            configurable: true,
          });
        }
      } else if (isPropertyDefinitionNode(member) && member.isStatic) {
        const propDef = member;
        const propName = propDef.name.name;

        if (propDef.value) {
          const staticValue = interpreter.evaluate(propDef.value, env);
          if (staticValue instanceof JacquesValue) {
            Object.defineProperty(classConstructor, propName, {
              value: staticValue,
              writable: true,
              configurable: true,
            });
          } else {
            Object.defineProperty(classConstructor, propName, {
              value: new JacquesNumber(0),
              writable: true,
              configurable: true,
            });
          }
        } else {
          Object.defineProperty(classConstructor, propName, {
            value: new JacquesNumber(0),
            writable: true,
            configurable: true,
          });
        }
      }
    }

    // Add class to environment if it has a name
    if (node.name !== null) {
      env[node.name.name] = classConstructor;
    }

    return classConstructor;
  }

  private evaluateIfStatement(
    node: IfStatementNode,
    env: Environment
  ): JacquesValue | ReturnValue | null {
    const conditionResult = this.evaluate(node.test, env);

    if (!(conditionResult instanceof JacquesValue)) {
      throw new Error(`If condition must evaluate to a Jacques value`);
    }

    let condition: boolean;

    if (conditionResult instanceof JacquesBoolean) {
      condition = conditionResult.value;
    } else if (conditionResult instanceof JacquesNumber) {
      condition = conditionResult.value !== 0;
    } else {
      condition = false;
    }

    if (condition) {
      for (const statement of node.consequent) {
        const result = this.evaluate(statement, env);

        if (isReturnValue(result)) {
          return result;
        }
      }
    } else if (node.alternate) {
      for (const statement of node.alternate) {
        const result = this.evaluate(statement, env);

        if (isReturnValue(result)) {
          return result;
        }
      }
    }

    return null;
  }

  private evaluateReturnStatement(
    node: ReturnStatementNode,
    env: Environment
  ): ReturnValue {
    const value = node.argument
      ? (this.evaluate(node.argument, env) as JacquesValue | null)
      : null;
    return { __return__: true, __value__: value };
  }

  private evaluateImportDeclaration(
    node: ImportDeclarationNode,
    env: Environment
  ): null {
    const sourcePath = node.source.value;
    let sourceModule: Record<string, JacquesValue | Function> = {};

    try {
      // Simple module resolution for now - just relative paths
      const sourceCode = require("fs").readFileSync(sourcePath, "utf8");
      const tokens = new Lexer(sourceCode).tokenize();
      const ast = new Parser(tokens).parse();
      const interpreter = new Interpreter(ast);
      const result = interpreter.execute();

      // Get exported values from interpreter's environment
      sourceModule = interpreter.getExports();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error importing module ${sourcePath}: ${errorMessage}`);
    }

    // Import each specifier
    for (const specifier of node.specifiers) {
      const name = specifier.name;

      if (!(name in sourceModule)) {
        throw new Error(`Export not found in module: ${name}`);
      }

      env[name] = sourceModule[name];
    }

    return null;
  }

  // Helper method to get exports from the current environment
  public getExports(): Record<string, JacquesValue | Function> {
    const exports: Record<string, JacquesValue | Function> = {};

    // Copy exported values from environment
    for (const key in this.env) {
      if (
        this.env[key] instanceof JacquesValue ||
        typeof this.env[key] === "function"
      ) {
        exports[key] = this.env[key];
      }
    }

    return exports;
  }

  private evaluateExportDeclaration(
    node: ExportDeclarationNode,
    env: Environment
  ): JacquesValue | Function | null {
    // Evaluate the declaration to add it to the environment
    const result = this.evaluate(node.declaration, env);

    // Return the result, but filter out ReturnValue type
    if (isReturnValue(result)) {
      return result.__value__;
    }

    return result;
  }

  private evaluateWhileStatement(
    node: WhileStatementNode,
    env: Environment
  ): JacquesValue | ReturnValue | null {
    let result: JacquesValue | ReturnValue | null = null;

    // Continue looping while the condition is true
    while (true) {
      // Evaluate the condition
      const condition = this.evaluate(node.condition, env);

      // Check if the condition is truthy
      let conditionValue = false;
      if (condition instanceof JacquesBoolean) {
        conditionValue = condition.value;
      } else if (condition instanceof JacquesNumber) {
        conditionValue = condition.value !== 0;
      } else if (condition instanceof JacquesString) {
        conditionValue = condition.value !== "";
      } else if (condition instanceof JacquesArray) {
        conditionValue = condition.elements.length > 0;
      } else if (condition instanceof JacquesMap) {
        conditionValue = Object.keys(condition.properties).length > 0;
      } else {
        conditionValue = Boolean(condition);
      }

      // Exit the loop if the condition is false
      if (!conditionValue) {
        break;
      }

      // Execute the body statements
      for (const statement of node.body) {
        const statementResult = this.evaluate(statement, env);

        // If we got a return value, exit the loop immediately
        if (isReturnValue(statementResult)) {
          return statementResult;
        }

        // Only set the result if it's a JacquesValue or ReturnValue
        if (
          statementResult instanceof JacquesValue ||
          isReturnValue(statementResult)
        ) {
          result = statementResult;
        }
      }
    }

    return result;
  }

  public execute(): JacquesValue | null {
    return this.evaluate(this.ast) as JacquesValue | null;
  }
}
