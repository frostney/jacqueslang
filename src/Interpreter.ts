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
  UpdateExpressionNode,
  PropertyDefinitionNode,
  PropertyDeclarationNode,
  TypeDeclarationNode,
  TypeInferenceNode,
  BlockStatementNode,
} from "./ASTNode";
import {
  JacquesValue,
  JacquesNumber,
  JacquesString,
  JacquesBoolean,
  JacquesArray,
  JacquesRecord,
  JacquesFunction,
  isReturnValue,
  JacquesClass,
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

import { Environment, type EnvironmentRecord } from "./Environment";

// ----- Interpreter -----
export class Interpreter {
  private ast: ProgramNode;
  private env: Environment;
  private builtins: Environment;
  private callStack: Environment[] = [];

  public get environment(): EnvironmentRecord {
    return this.env.getAll();
  }

  constructor(ast: ProgramNode) {
    this.ast = ast;
    this.env = new Environment();
    this.builtins = new Environment();
    this.initializeBuiltins();
  }

  private initializeBuiltins(): void {
    // Built-in functions
    this.builtins.define(
      "Println",
      JacquesFunction.FromFunction((...args: JacquesValue[]): null => {
        console.log(...args.map((arg) => arg.ToString().value));
        return null;
      }),
      true
    );

    // Built-in constructors
    this.builtins.define(
      "Number",
      JacquesFunction.FromFunction((value: unknown = 0): JacquesNumber => {
        if (typeof value === "number") {
          return new JacquesNumber(value);
        } else if (typeof value === "string") {
          return new JacquesNumber(parseFloat(value));
        } else if (value instanceof JacquesNumber) {
          return new JacquesNumber(value.value);
        } else {
          return new JacquesNumber(0);
        }
      }),
      false // Not a constant binding
    );

    this.builtins.define(
      "String",
      JacquesFunction.FromFunction((value: unknown = ""): JacquesString => {
        if (value instanceof JacquesValue) {
          return value.ToString();
        }
        return new JacquesString(String(value));
      }),
      false // Not a constant binding
    );

    this.builtins.define(
      "Boolean",
      JacquesFunction.FromFunction((value: unknown = false): JacquesBoolean => {
        return new JacquesBoolean(Boolean(value));
      }),
      false // Not a constant binding
    );

    this.builtins.define(
      "Array",
      JacquesFunction.FromFunction(
        (...elements: JacquesValue[]): JacquesArray => {
          return new JacquesArray(elements);
        }
      ),
      false // Not a constant binding
    );

    this.builtins.define(
      "Map",
      JacquesFunction.FromFunction(
        (properties: Record<string, JacquesValue> = {}): JacquesRecord => {
          return new JacquesRecord(properties);
        }
      ),
      false // Not a constant binding
    );
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
      case "UpdateExpression":
        return this.visitUpdateExpression(node as UpdateExpressionNode, env);
      case "TypeDeclaration":
        return this.evaluateTypeDeclaration(node as TypeDeclarationNode, env);
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
      if (env.has("self")) {
        const self = env.get("self") as JacquesRecord;
        if (propName in self.properties) {
          return self.properties[propName];
        }
      }

      throw new Error(`Undefined instance property: ${propName}`);
    }

    // Try to get the variable from the environment
    if (env.has(name)) {
      return env.get(name);
    }

    // Check builtins as a fallback
    if (this.builtins.has(name)) {
      return this.builtins.get(name);
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
        // Special handling for string concatenation - allow any type to be converted to string
        if (left instanceof JacquesString || right instanceof JacquesString) {
          // Convert both operands to strings and concatenate
          return new JacquesString(
            left.ToString().value + right.ToString().value
          );
        }

        if (left instanceof JacquesNumber && right instanceof JacquesNumber) {
          return left.Add(right);
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
        return left.Equals(right);
      case "!=":
        return left.NotEquals(right);
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
  ): JacquesValue | null {
    if (node.left.type !== "Identifier") {
      throw new Error("Left side of assignment must be an identifier");
    }

    const name = (node.left as IdentifierNode).name;
    const valueResult = this.evaluate(node.right, env);

    // For an existing variable (reassignment)
    if (env.has(name)) {
      const currentValue = env.get(name);

      // Type checking - ensure same types for reassignment
      // Only check types if both values are JacquesValues
      if (
        valueResult instanceof JacquesValue &&
        currentValue instanceof JacquesValue
      ) {
        const newType = valueResult.__type__;
        const currentType = currentValue.__type__;

        // Skip type checking only if:
        // 1. Types are the same, or
        // 2. We're dealing with functions, or
        // 3. We're assigning a string result to a variable (for string concatenation)
        const isSameType = newType === currentType;
        const isFunctionType =
          valueResult instanceof JacquesFunction ||
          currentValue instanceof JacquesFunction;
        const isStringResult = valueResult instanceof JacquesString;

        // Allow string results to be assigned to any variable (for string concatenation)
        if (!isSameType && !isFunctionType && !isStringResult) {
          throw new Error(
            `Type error: Cannot assign value of type ${newType} to variable of type ${currentType}`
          );
        }
      }

      return env.assign(name, valueResult as JacquesValue);
    } else {
      // Define a new variable
      if (valueResult instanceof JacquesValue) {
        // For new variables, we set the constant flag based on the isConstant property
        const isConstant = node.isConstant;

        // Set the constantValue property on the JacquesValue
        valueResult.constantValue = isConstant;

        // Define the variable in the environment
        env.define(name, valueResult, isConstant);
        return valueResult;
      }

      throw new Error(`Cannot assign non-value to variable: ${name}`);
    }
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

    console.log("elements", elements);

    const array = new JacquesArray(elements);
    console.log("array", array);
    return array;
  }

  private evaluateObjectLiteral(
    node: ObjectLiteralNode,
    env: Environment
  ): JacquesRecord {
    const properties: Record<string, JacquesValue> = {};

    for (const { key, value } of node.properties) {
      const valueResult = this.evaluate(value, env);

      if (!(valueResult instanceof JacquesValue)) {
        throw new Error(`Object property values must be Jacques values`);
      }

      properties[key] = valueResult;
    }

    return new JacquesRecord(properties);
  }

  private evaluateMemberExpression(
    node: MemberExpressionNode,
    env: Environment
  ): JacquesValue {
    const object = this.evaluate(node.object, env);

    if (!object) {
      throw new Error("Cannot access property of null or undefined");
    }

    if (!(object instanceof JacquesValue)) {
      throw new Error(
        `Cannot access property of non-JacquesValue: ${typeof object}`
      );
    }

    // Handle computed property access
    if (node.computed) {
      const property = this.evaluate(node.property, env);
      if (property instanceof JacquesString) {
        // Handle string property access (like object["key"])
        if (object instanceof JacquesRecord) {
          return object.properties[property.value] || new JacquesNumber(0);
        } else {
          // For other JacquesValue types, check if the property exists
          if (Object.prototype.hasOwnProperty.call(object, property.value)) {
            const prop = Reflect.get(object, property.value);
            if (prop instanceof JacquesValue) {
              return prop;
            }
          }
          return new JacquesNumber(0);
        }
      } else if (
        property instanceof JacquesNumber &&
        object instanceof JacquesArray
      ) {
        // Handle array index access (like array[0])
        const index = Math.floor(property.value);
        if (index >= 0 && index < object.elements.length) {
          return object.elements[index];
        }
        throw new Error(`Array index out of bounds: ${index}`);
      }
      throw new Error("Property accessor must be a string or number");
    }

    // Handle direct property access
    if (node.property.type !== "Identifier") {
      throw new Error("Property must be an identifier");
    }

    const propertyName = (node.property as IdentifierNode).name;

    // TODO: We need to find a more unified way to map host access to Jacques access

    // First check for JacquesFunction special properties
    if (object instanceof JacquesFunction) {
      if (propertyName === "Name") {
        return new JacquesString(object.name);
      }
    }

    // Then check for built-in properties
    if (object instanceof JacquesArray) {
      if (propertyName === "Length") {
        return object.Length;
      }
    }

    // For records, check in properties
    if (object instanceof JacquesRecord && propertyName in object.properties) {
      return object.properties[propertyName];
    }

    // Try to access property directly
    if (propertyName in object) {
      const prop = (object as any)[propertyName];

      // For functions, bind them to the object
      if (typeof prop === "function") {
        return prop.bind(object);
      }

      return prop;
    }

    throw new Error(
      `Property '${propertyName}' not found on ${object.constructor.name}`
    );
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
  ): JacquesFunction {
    // Get the function name, or use "anonymous" for function expressions
    const functionName = node.name ? node.name.name : "anonymous";

    // Create the function implementation that will execute when called
    const func = function (this: any, ...rawArgs: any[]): JacquesValue | null {
      // Convert args to JacquesValue array if needed
      const args = Array.isArray(rawArgs[0]) ? rawArgs[0] : rawArgs;

      // Create a new environment for the function execution
      const functionEnv = new Environment(env);

      // Add built-in functions to the function's environment
      // Use the proper way to iterate through the builtins Map
      for (const [key, value] of this.builtins.values.entries()) {
        functionEnv.define(key, value.value, value.constantBinding);
      }

      // Track function call in the call stack
      this.callStack.push(functionEnv);

      try {
        // Bind parameters to arguments
        for (let i = 0; i < node.params.length; i++) {
          const param = node.params[i];
          const paramName = param.name;

          // Get the argument or use the default value
          let arg: JacquesValue;
          if (i < args.length && args[i] !== undefined) {
            arg = args[i];
          } else if (param.defaultValue) {
            arg = this.evaluate(param.defaultValue, env) as JacquesValue;
          } else {
            throw new Error(`Missing argument for parameter: ${paramName}`);
          }

          // Define the parameter in the function's environment
          functionEnv.define(paramName, arg, false);
        }

        // Define the function itself in its own environment for recursion
        // Only do this for named functions, not anonymous function expressions
        if (functionName !== "anonymous") {
          const jacquesFunction = new JacquesFunction(
            func,
            functionName,
            node.params.map((p) => p.name)
          );
          functionEnv.define(functionName, jacquesFunction, false);
        }

        // Define a Result variable in the function's environment
        functionEnv.define("Result", new JacquesNumber(0), false);

        // Execute the function body
        for (const statement of node.body) {
          const result = this.evaluate(statement, functionEnv);

          // Handle return statements
          if (isReturnValue(result)) {
            return result.__value__;
          }
        }

        // Return the Result variable
        return functionEnv.get("Result");
      } finally {
        // Remove this function call from the call stack
        this.callStack.pop();
      }
    }.bind(this); // Bind the interpreter instance to this

    // Extract parameter names
    const paramNames = node.params.map((p) => p.name);

    // Create a JacquesFunction object with the correct name
    const jacquesFunction = new JacquesFunction(func, functionName, paramNames);

    // Define the function in the environment if it has a name
    if (node.name) {
      env.define(node.name.name, jacquesFunction, false);
    }

    return jacquesFunction;
  }

  private evaluateLambdaExpression(
    node: LambdaExpressionNode,
    env: Environment
  ): JacquesFunction {
    // Create the function that will be executed when the lambda is called
    const lambdaFunc = function (
      this: any,
      ...rawArgs: any[]
    ): JacquesValue | null {
      // Convert args to JacquesValue array if needed
      const args = Array.isArray(rawArgs[0]) ? rawArgs[0] : rawArgs;

      // Create a new environment with the current environment as parent
      const lambdaEnv = new Environment(env);

      // Add built-in functions to the lambda's environment
      // Use the proper way to iterate through the builtins Map
      for (const [key, value] of this.builtins.values.entries()) {
        lambdaEnv.define(key, value.value, value.constantBinding);
      }

      // Track lambda call in the call stack
      this.callStack.push(lambdaEnv);

      try {
        // Bind parameters to arguments
        for (let i = 0; i < node.params.length; i++) {
          const param = node.params[i];
          let argValue: JacquesValue;

          if (i < args.length && args[i] !== undefined) {
            // Use provided argument
            argValue = args[i];
          } else if (param.defaultValue) {
            // Use default value if available
            argValue = this.evaluate(param.defaultValue, env) as JacquesValue;
          } else {
            // Otherwise use a default value of 0
            argValue = new JacquesNumber(0);
          }

          // Parameters can never be constants
          lambdaEnv.define(param.name, argValue, false);
        }

        // For lambda expressions, directly evaluate the body and return the result
        const bodyResult = this.evaluate(node.body, lambdaEnv);

        if (bodyResult instanceof JacquesValue) {
          return bodyResult;
        }

        return new JacquesNumber(0); // Default return value
      } finally {
        // Remove this lambda call from the call stack
        this.callStack.pop();
      }
    }.bind(this); // Bind the interpreter instance to this

    // Extract parameter names
    const paramNames = node.params.map((param) => param.name);

    // Create a JacquesFunction wrapper
    return new JacquesFunction(lambdaFunc, "lambda", paramNames);
  }

  private evaluateClassDeclaration(
    node: ClassDeclarationNode,
    env: Environment
  ): JacquesClass {
    const className = node.name.name;

    // Process inheritance if any
    let superClass: JacquesClass | null = null;
    if (node.superClass) {
      const superClassValue = this.evaluate(node.superClass, env);
      if (superClassValue instanceof JacquesClass) {
        superClass = superClassValue;
      } else {
        throw new Error(`Superclass ${node.superClass.name} is not a class`);
      }
    }

    // Process class body
    const staticProperties: Record<string, JacquesValue> = {};
    const instanceProperties: Record<string, JacquesValue> = {};
    const privateProperties: Record<string, JacquesValue> = {};
    const protectedProperties: Record<string, JacquesValue> = {};
    const methods: Record<string, JacquesFunction> = {};
    const staticMethods: Record<string, JacquesFunction> = {};
    const privateMethods: Record<string, JacquesFunction> = {};
    const protectedMethods: Record<string, JacquesFunction> = {};
    let constructorFunc: JacquesFunction | null = null;

    // Create the class
    const jacquesClass = new JacquesClass(
      className,
      superClass,
      {}, // properties
      {}, // methods
      null // constructorFunc
    );

    // Process each member of the class body
    for (const prop of node.body) {
      // Process property definitions
      if (isPropertyDefinitionNode(prop)) {
        const propName = prop.name.name;
        const propValue = prop.value
          ? (this.evaluate(prop.value, env) as JacquesValue)
          : new JacquesNumber(0);

        // No need to set __type__ as it's derived from constructor

        // Set constants - property is constant if defined with const
        // We need to check how constants are defined in the language spec
        propValue.constantValue = false; // Update based on language spec

        if (prop.isStatic) {
          staticProperties[propName] = propValue;
        } else if (prop.isPrivate) {
          privateProperties[propName] = propValue;
        } else if (prop.isProtected) {
          protectedProperties[propName] = propValue;
        } else {
          instanceProperties[propName] = propValue;
        }
      }
      // Process method definitions
      else if (isMethodDefinitionNode(prop)) {
        const methodName = prop.name.name;

        // Create method function
        const methodFunc = (...args: JacquesValue[]): JacquesValue | null => {
          // Create a new environment for the method
          const methodEnv = new Environment(env);

          // Copy environment variables
          // No need to copy anymore since we're using the parent environment

          // Set 'self' to the first argument (the instance)
          if (args.length > 0) {
            methodEnv.define("self", args[0]);
          }

          // Set the current class for 'super' keyword
          methodEnv.define("currentClass", jacquesClass);

          // Bind parameters to arguments (skip the first arg which is 'self')
          for (let i = 0; i < prop.function.params.length; i++) {
            const param = prop.function.params[i];
            let argValue: JacquesValue;

            if (i + 1 < args.length) {
              // Use provided argument
              argValue = args[i + 1];
            } else {
              // Otherwise use a default value of 0
              argValue = new JacquesNumber(0);
            }

            // Mark as constant if this is a shorthand property
            argValue.constantValue = param.isShorthandProperty || false;

            methodEnv.define(param.name, argValue);
          }

          // Execute method body
          let result: JacquesValue | Function | ReturnValue | null = null;
          for (const statement of prop.function.body) {
            result = this.evaluate(statement, methodEnv);

            if (isReturnValue(result)) {
              return (result as ReturnValue).__value__;
            }
          }

          return result instanceof JacquesValue ? result : null;
        };

        // Create a JacquesFunction for the method
        const jacquesMethod = new JacquesFunction(
          methodFunc,
          methodName,
          prop.function.params.map((p) => p.name)
        );

        // Set method as constant
        jacquesMethod.constantValue = true;

        // Store the method in the appropriate collection
        if (prop.isConstructor) {
          constructorFunc = jacquesMethod;
          // Create a proper JacquesClassMethod object
          jacquesClass.constructorFunc = {
            value: jacquesMethod,
            modifier: "instance",
          };
        } else if (prop.isStatic) {
          staticMethods[methodName] = jacquesMethod;
          // Use proper methods to set methods on the class
          jacquesClass.DefineMethod(methodName, jacquesMethod, "static");
        } else if (prop.isPrivate) {
          privateMethods[methodName] = jacquesMethod;
          jacquesClass.DefineMethod(methodName, jacquesMethod, "private");
        } else if (prop.isProtected) {
          protectedMethods[methodName] = jacquesMethod;
          jacquesClass.DefineMethod(methodName, jacquesMethod, "protected");
        } else {
          methods[methodName] = jacquesMethod;
          jacquesClass.DefineMethod(methodName, jacquesMethod, "instance");
        }
      }
    }

    // Store the class in the environment
    jacquesClass.constantValue = true;
    env.define(className, jacquesClass);

    return jacquesClass;
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

      const importedValue = sourceModule[name];

      // Set type information if it's a JacquesValue
      if (importedValue instanceof JacquesValue) {
        (importedValue as any).__type__ = importedValue.constructor.name;
      }

      env.define(name, importedValue);
    }

    return null;
  }

  // Helper method to get exports from the current environment
  public getExports(): Record<string, JacquesValue | Function> {
    const exports: Record<string, JacquesValue | Function> = {};
    const allVars = this.env.getAll();

    // Copy exported values from environment
    for (const key in allVars) {
      if (
        allVars[key] instanceof JacquesValue ||
        typeof allVars[key] === "function"
      ) {
        exports[key] = allVars[key];
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
      } else if (condition instanceof JacquesRecord) {
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

  private visitUpdateExpression(
    node: UpdateExpressionNode,
    env: Environment
  ): JacquesValue {
    if (node.operator === "++" && !node.prefix) {
      // Handle postfix increment (x++)
      if (node.argument.type !== "Identifier") {
        throw new Error("Invalid left-hand side in assignment");
      }

      const variableName = (node.argument as IdentifierNode).name;

      // Get the current value from the environment
      if (!env.has(variableName)) {
        throw new Error(`Variable ${variableName} is not defined`);
      }

      const currentValue = env.get(variableName);

      if (!(currentValue instanceof JacquesNumber)) {
        throw new Error("Cannot increment non-number value");
      }

      // Check if we're trying to update a constant
      if (currentValue.constantValue) {
        throw new Error(`Cannot update constant variable: ${variableName}`);
      }

      // Create a new number with incremented value
      const newValue = new JacquesNumber(currentValue.value + 1);

      // Preserve constant flag
      newValue.constantValue = currentValue.constantValue;

      // Update the variable
      env.define(variableName, newValue);

      // For postfix increment, return the original value
      return currentValue;
    }

    throw new Error(`Unsupported update expression: ${node.operator}`);
  }

  private evaluateTypeDeclaration(
    node: TypeDeclarationNode,
    env: Environment
  ): JacquesValue {
    const name = node.name.name;
    const typeAnnotation = node.typeAnnotation;

    // Initialize with default value based on type
    let value: JacquesValue;
    switch (typeAnnotation.name) {
      case "Number":
        value = new JacquesNumber(0);
        break;
      case "String":
        value = new JacquesString("");
        break;
      case "Boolean":
        value = new JacquesBoolean(true); // Default Boolean value is true according to spec.md
        break;
      case "Array":
        value = new JacquesArray([]);
        break;
      case "Record":
        value = new JacquesRecord({});
        break;
      default:
        throw new Error(`Unknown type: ${typeAnnotation.name}`);
    }

    // Add to environment - type declarations are non-constant by default
    env.define(name, value, false);
    return value;
  }

  public execute(): JacquesValue | null {
    return this.evaluate(this.ast) as JacquesValue | null;
  }
}
