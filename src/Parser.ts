import type { Token } from "./Token";
import type {
  ProgramNode,
  ASTNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  IdentifierNode,
  MemberExpressionNode,
  AssignmentNode,
  ArrayLiteralNode,
  ObjectLiteralNode,
  FunctionDeclarationNode,
  LambdaExpressionNode,
  ClassDeclarationNode,
  IfStatementNode,
  ReturnStatementNode,
  ImportDeclarationNode,
  ExportDeclarationNode,
  MethodDefinitionNode,
  PropertyDefinitionNode,
  PropertyDeclarationNode,
  CallExpressionNode,
  UnaryExpressionNode,
  BinaryExpressionNode,
  WhileStatementNode,
  UpdateExpressionNode,
  TypeDeclarationNode,
  TypeInferenceNode,
  TypeNode,
} from "./ASTNode";

import { TokenType } from "./Token";

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  private currentToken: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    // Initialize currentToken to the first token
    this.currentToken = this.tokens[0];
  }

  private eat(tokenType: TokenType): Token {
    if (this.currentToken.type === tokenType) {
      const token = this.currentToken;
      this.position++;

      if (this.position < this.tokens.length) {
        this.currentToken = this.tokens[this.position];
      }

      return token;
    }

    throw new Error(
      `Unexpected token: ${this.currentToken.type}, expected: ${tokenType} at line ${this.currentToken.line}, column ${this.currentToken.column}`
    );
  }

  private peek(n: number = 1): Token {
    const peekPos = this.position + n;
    if (peekPos >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF token
    }
    return this.tokens[peekPos];
  }

  private match(tokenType: TokenType): boolean {
    return this.currentToken.type === tokenType;
  }

  private optionalSemicolon(): void {
    if (this.match(TokenType.SEMICOLON)) {
      this.eat(TokenType.SEMICOLON);
    }
  }

  // Program -> Statement*
  public parse(): ProgramNode {
    const program: ProgramNode = {
      type: "Program",
      body: [],
    };

    while (this.currentToken.type !== TokenType.EOF) {
      program.body.push(this.statement());
    }

    return program;
  }

  // Statement
  private statement(): ASTNode {
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    } else if (this.match(TokenType.FUNCTION)) {
      return this.functionDeclaration();
    } else if (this.match(TokenType.CLASS)) {
      return this.classDeclaration();
    } else if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    } else if (this.match(TokenType.RETURN)) {
      return this.returnStatement();
    } else if (this.match(TokenType.IMPORT)) {
      return this.importDeclaration();
    } else if (this.match(TokenType.EXPORT)) {
      return this.exportDeclaration();
    } else if (this.match(TokenType.IDENTIFIER)) {
      // Get the identifier
      const identifier = this.identifier();

      // Type declaration with explicit type
      if (this.match(TokenType.COLON)) {
        return this.typeDeclaration(identifier);
      }

      // Variable assignment (with type inference)
      if (this.match(TokenType.ASSIGN) || this.match(TokenType.CONST_ASSIGN)) {
        const isConstant = this.currentToken.type === TokenType.CONST_ASSIGN;
        this.eat(this.currentToken.type);
        const right = this.expression();
        this.optionalSemicolon();

        return {
          type: "Assignment",
          isConstant,
          left: identifier,
          right,
        } as AssignmentNode;
      }

      // Just the identifier expression
      const expr = {
        type: "Identifier",
        name: identifier.name,
      } as IdentifierNode;

      this.optionalSemicolon();
      return expr;
    } else {
      const expr = this.expression();
      this.optionalSemicolon();
      return expr;
    }
  }

  private typeDeclaration(
    identifier: IdentifierNode
  ): TypeDeclarationNode | AssignmentNode {
    this.eat(TokenType.COLON);
    const typeAnnotation = this.parseType();

    // Check if there's an assignment after the type declaration
    if (this.match(TokenType.ASSIGN) || this.match(TokenType.CONST_ASSIGN)) {
      const isConstant = this.currentToken.type === TokenType.CONST_ASSIGN;
      this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);
      const right = this.expression();
      this.optionalSemicolon();

      return {
        type: "Assignment",
        isConstant,
        left: identifier,
        right,
        typeAnnotation, // Add the type annotation to the assignment
      } as AssignmentNode;
    }

    // Simple type declaration without initialization
    this.optionalSemicolon();
    return {
      type: "TypeDeclaration",
      name: identifier,
      typeAnnotation,
    } as TypeDeclarationNode;
  }

  private parseType(): TypeNode {
    const name = this.identifier().name;
    let isArray = false;

    return {
      type: "Type",
      name,
      isArray,
    } as TypeNode;
  }

  // While statement
  private whileStatement(): WhileStatementNode {
    this.eat(TokenType.WHILE);
    const condition = this.expression();
    const body: ASTNode[] = [];

    while (!this.match(TokenType.END)) {
      body.push(this.statement());
    }

    this.eat(TokenType.END);
    this.optionalSemicolon();

    return {
      type: "WhileStatement",
      condition,
      body,
    } as WhileStatementNode;
  }

  // Expression
  private expression(): ASTNode {
    // Check for assignment expressions
    if (
      // Direct identifier assignment: x = value
      (((this.currentToken.type as string) ===
        (TokenType.IDENTIFIER as string) ||
        (this.currentToken.type as string) === (TokenType.RESULT as string) ||
        (this.currentToken.type as string) === (TokenType.AT as string) ||
        (this.currentToken.type as string) === (TokenType.SELF as string)) &&
        this.position + 1 < this.tokens.length &&
        ((this.tokens[this.position + 1].type as string) ===
          (TokenType.ASSIGN as string) ||
          (this.tokens[this.position + 1].type as string) ===
            (TokenType.CONST_ASSIGN as string))) ||
      // Member expression assignment: obj.prop = value or self.prop = value
      (((this.currentToken.type as string) ===
        (TokenType.IDENTIFIER as string) ||
        (this.currentToken.type as string) === (TokenType.SELF as string)) &&
        this.position + 1 < this.tokens.length &&
        (this.tokens[this.position + 1].type as string) ===
          (TokenType.DOT as string) &&
        this.position + 2 < this.tokens.length &&
        (this.tokens[this.position + 2].type as string) ===
          (TokenType.IDENTIFIER as string) &&
        this.position + 3 < this.tokens.length &&
        ((this.tokens[this.position + 3].type as string) ===
          (TokenType.ASSIGN as string) ||
          (this.tokens[this.position + 3].type as string) ===
            (TokenType.CONST_ASSIGN as string)))
    ) {
      return this.assignmentExpression();
    }

    // Check for lambda expressions
    if (this.match(TokenType.LPAREN)) {
      const startPosition = this.position;

      try {
        // Try to parse as lambda expression
        const expr = this.lambdaExpression();
        return expr;
      } catch (e) {
        // Not a lambda, rewind and continue with normal expression parsing
        this.position = startPosition;
        this.currentToken = this.tokens[this.position];
      }
    } else if (this.match(TokenType.IDENTIFIER)) {
      const startPosition = this.position;

      try {
        // Check for identifier followed by => (single parameter lambda without parentheses)
        const identifier = this.identifier();

        if (this.match(TokenType.ARROW)) {
          this.eat(TokenType.ARROW);
          const body = this.expression();

          return {
            type: "LambdaExpression",
            params: [identifier],
            body,
          } as LambdaExpressionNode;
        }

        // Not a lambda, rewind and continue with normal expression parsing
        this.position = startPosition;
        this.currentToken = this.tokens[this.position];
      } catch (e) {
        // Not a lambda, rewind and continue with normal expression parsing
        this.position = startPosition;
        this.currentToken = this.tokens[this.position];
      }
    }

    return this.logicalExpression();
  }

  // Assignment
  private assignmentExpression(): AssignmentNode {
    let left: IdentifierNode | MemberExpressionNode;

    if (
      (this.currentToken.type as string) === (TokenType.IDENTIFIER as string)
    ) {
      left = this.identifier();
    } else if (
      (this.currentToken.type as string) === (TokenType.RESULT as string)
    ) {
      this.eat(TokenType.RESULT);
      left = {
        type: "Identifier",
        name: "Result",
      } as IdentifierNode;
    } else if (
      (this.currentToken.type as string) === (TokenType.AT as string)
    ) {
      // Handle @ prefix for instance property access
      this.eat(TokenType.AT);
      const name = this.identifier().name;
      left = {
        type: "Identifier",
        name: "@" + name, // Prefix with @ to indicate instance property
      } as IdentifierNode;
    } else if (
      (this.currentToken.type as string) === (TokenType.SELF as string)
    ) {
      // Handle self reference
      this.eat(TokenType.SELF);

      // Check for dot notation
      if (this.match(TokenType.DOT)) {
        this.eat(TokenType.DOT);
        const property = this.identifier();
        left = {
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "self",
          } as IdentifierNode,
          property,
          computed: false,
        } as MemberExpressionNode;
      } else {
        left = {
          type: "Identifier",
          name: "self",
        } as IdentifierNode;
      }
    } else {
      throw new Error(
        `Expected identifier, Result, @property, or self, got ${this.currentToken.type}`
      );
    }

    // Check for member expression
    while (this.match(TokenType.DOT) || this.match(TokenType.LBRACKET)) {
      if (this.match(TokenType.DOT)) {
        this.eat(TokenType.DOT);
        const property = this.identifier();
        left = {
          type: "MemberExpression",
          object: left,
          property,
          computed: false,
        } as MemberExpressionNode;
      } else {
        this.eat(TokenType.LBRACKET);
        const property = this.expression();
        this.eat(TokenType.RBRACKET);
        left = {
          type: "MemberExpression",
          object: left,
          property,
          computed: true,
        } as MemberExpressionNode;
      }
    }

    // Use string comparison instead of enum comparison
    const isConstant =
      (this.currentToken.type as string) === (TokenType.CONST_ASSIGN as string);
    this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);

    // Check for lambda expression
    if (this.match(TokenType.LPAREN)) {
      const startPosition = this.position;

      try {
        // Try to parse as lambda expression
        this.eat(TokenType.LPAREN);

        // Parse parameters
        const params: IdentifierNode[] = [];

        // Empty parameter list
        if (!this.match(TokenType.RPAREN)) {
          // Parse first parameter
          if (this.match(TokenType.IDENTIFIER)) {
            params.push(this.identifier());

            // Parse additional parameters
            while (this.match(TokenType.COMMA)) {
              this.eat(TokenType.COMMA);
              if (this.match(TokenType.IDENTIFIER)) {
                params.push(this.identifier());
              } else {
                throw new Error(
                  "Expected identifier after comma in lambda parameters"
                );
              }
            }
          } else {
            throw new Error(
              "Expected identifier or closing parenthesis in lambda parameters"
            );
          }
        }

        // End of parameter list
        this.eat(TokenType.RPAREN);

        // Check for arrow to confirm it's a lambda
        if (this.match(TokenType.ARROW)) {
          this.eat(TokenType.ARROW);
          const body = this.expression();

          return {
            type: "Assignment",
            isConstant,
            left,
            right: {
              type: "LambdaExpression",
              params,
              body,
            } as LambdaExpressionNode,
          } as AssignmentNode;
        }

        // Not a lambda, rewind
        this.position = startPosition;
        this.currentToken = this.tokens[this.position];
      } catch (e) {
        // Error parsing as lambda, rewind
        this.position = startPosition;
        this.currentToken = this.tokens[this.position];
      }
    }

    const right = this.expression();

    return {
      type: "Assignment",
      isConstant,
      left,
      right,
    } as AssignmentNode;
  }

  // Logical expressions (AND, OR)
  private logicalExpression(): ASTNode {
    let left = this.equalityExpression();

    while (this.match(TokenType.AND) || this.match(TokenType.OR)) {
      const operator = this.eat(this.currentToken.type).value;
      // Type checking with TS
      if (typeof operator !== "string") {
        throw new Error(
          `Expected operator to be string, got ${typeof operator}`
        );
      }
      const right = this.equalityExpression();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // Equality expressions (==, !=)
  private equalityExpression(): ASTNode {
    let left = this.relationalExpression();

    while (this.match(TokenType.EQUALS) || this.match(TokenType.NOT_EQUALS)) {
      const operator = this.eat(this.currentToken.type).value;
      // Type checking with TS
      if (typeof operator !== "string") {
        throw new Error(
          `Expected operator to be string, got ${typeof operator}`
        );
      }
      const right = this.relationalExpression();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // Relational expressions (<, >, <=, >=)
  private relationalExpression(): ASTNode {
    let left = this.additiveExpression();

    while (
      this.match(TokenType.LESS_THAN) ||
      this.match(TokenType.GREATER_THAN) ||
      this.match(TokenType.LESS_THAN_OR_EQUAL) ||
      this.match(TokenType.GREATER_THAN_OR_EQUAL)
    ) {
      const operator = this.eat(this.currentToken.type).value;
      // Type checking with TS
      if (typeof operator !== "string") {
        throw new Error(
          `Expected operator to be string, got ${typeof operator}`
        );
      }
      const right = this.additiveExpression();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // Additive expressions (+, -)
  private additiveExpression(): ASTNode {
    let left = this.multiplicativeExpression();

    while (this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
      const operator = this.eat(this.currentToken.type).value;
      // Type checking with TS
      if (typeof operator !== "string") {
        throw new Error(
          `Expected operator to be string, got ${typeof operator}`
        );
      }
      const right = this.multiplicativeExpression();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // Multiplicative expressions (*, /, %)
  private multiplicativeExpression(): ASTNode {
    let left = this.unaryExpression();

    while (
      this.match(TokenType.MULTIPLY) ||
      this.match(TokenType.DIVIDE) ||
      this.match(TokenType.MODULO)
    ) {
      const operator = this.eat(this.currentToken.type).value;
      // Type checking with TS
      if (typeof operator !== "string") {
        throw new Error(
          `Expected operator to be string, got ${typeof operator}`
        );
      }
      const right = this.unaryExpression();

      left = {
        type: "BinaryExpression",
        operator,
        left,
        right,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // Unary expressions (!, -)
  private unaryExpression(): ASTNode {
    if (this.match(TokenType.NOT) || this.match(TokenType.MINUS)) {
      const operator = this.eat(this.currentToken.type).value;
      // Type checking with TS
      if (typeof operator !== "string") {
        throw new Error(
          `Expected operator to be string, got ${typeof operator}`
        );
      }
      const argument = this.unaryExpression();

      return {
        type: "UnaryExpression",
        operator,
        argument,
      } as UnaryExpressionNode;
    }

    return this.callMemberExpression();
  }

  // CallMemberExpression -> MemberExpression ('(' Arguments ')')*
  private callMemberExpression(): ASTNode {
    let expr = this.primaryExpression();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.callExpression(expr);
      } else if (this.match(TokenType.DOT)) {
        expr = this.memberExpression(expr, false);
      } else if (this.match(TokenType.LBRACKET)) {
        expr = this.memberExpression(expr, true);
      } else {
        break;
      }
    }

    return expr;
  }

  // CallExpression -> Callee '(' Arguments ')'
  private callExpression(callee: ASTNode): CallExpressionNode {
    this.eat(TokenType.LPAREN);
    const args = this.arguments();
    this.eat(TokenType.RPAREN);

    return {
      type: "CallExpression",
      callee,
      arguments: args,
    } as CallExpressionNode;
  }

  // Arguments -> (Expression (',' Expression)*)?
  private arguments(): ASTNode[] {
    const args: ASTNode[] = [];

    if (!this.match(TokenType.RPAREN)) {
      // Parse first argument
      args.push(this.expression());

      // Parse additional arguments if any
      while (this.match(TokenType.COMMA)) {
        this.eat(TokenType.COMMA);
        args.push(this.expression());
      }
    }

    return args;
  }

  // MemberExpression -> Object '.' Property | Object '[' Expression ']'
  private memberExpression(
    object: ASTNode,
    computed: boolean
  ): MemberExpressionNode {
    if (computed) {
      this.eat(TokenType.LBRACKET);
      const property = this.expression();
      this.eat(TokenType.RBRACKET);

      return {
        type: "MemberExpression",
        object,
        property,
        computed,
      } as MemberExpressionNode;
    } else {
      this.eat(TokenType.DOT);
      const idToken = this.eat(TokenType.IDENTIFIER);

      // Type checking with TS
      if (typeof idToken.value !== "string") {
        throw new Error(
          `Expected identifier name to be string, got ${typeof idToken.value}`
        );
      }

      const property: IdentifierNode = {
        type: "Identifier",
        name: idToken.value,
      };

      return {
        type: "MemberExpression",
        object,
        property,
        computed,
      } as MemberExpressionNode;
    }
  }

  // Primary expressions
  private primaryExpression(): ASTNode {
    switch (this.currentToken.type) {
      case TokenType.NUMBER:
        return this.numberLiteral();
      case TokenType.STRING:
        return this.stringLiteral();
      case TokenType.BOOLEAN:
        return this.booleanLiteral();
      case TokenType.IDENTIFIER:
        const identifier = this.identifier();

        // Check for increment operator
        if (this.match(TokenType.INCREMENT)) {
          return {
            type: "UpdateExpression",
            operator: "++",
            argument: identifier,
            prefix: false,
          } as UpdateExpressionNode;
        }

        return identifier;
      case TokenType.AT:
        // Handle @ prefix for instance property access
        this.eat(TokenType.AT);
        const name = this.identifier().name;
        return {
          type: "Identifier",
          name: "@" + name, // Prefix with @ to indicate instance property
        } as IdentifierNode;
      case TokenType.SELF:
        this.eat(TokenType.SELF);
        return {
          type: "Identifier",
          name: "self",
        } as IdentifierNode;
      case TokenType.RESULT:
        this.eat(TokenType.RESULT);
        return {
          type: "Identifier",
          name: "Result",
        } as IdentifierNode;
      case TokenType.LPAREN:
        // Check for lambda expressions
        const startPosition = this.position;

        try {
          this.eat(TokenType.LPAREN);

          // Empty parameter list
          if (this.match(TokenType.RPAREN)) {
            this.eat(TokenType.RPAREN);

            // Check for arrow to confirm it's a lambda
            if (this.match(TokenType.ARROW)) {
              this.eat(TokenType.ARROW);
              const body = this.expression();

              return {
                type: "LambdaExpression",
                params: [],
                body,
              } as LambdaExpressionNode;
            }

            // Not a lambda, rewind and try as parenthesized expression
            this.position = startPosition;
            this.currentToken = this.tokens[this.position];
            return this.parenthesizedExpression();
          }

          // Non-empty parameter list
          if (this.match(TokenType.IDENTIFIER)) {
            const params: IdentifierNode[] = [];

            // Parse first parameter
            params.push(this.identifier());

            // Check for more parameters
            while (this.match(TokenType.COMMA)) {
              this.eat(TokenType.COMMA);
              params.push(this.identifier());
            }

            // End of parameter list
            this.eat(TokenType.RPAREN);

            // Check for arrow to confirm it's a lambda
            if (this.match(TokenType.ARROW)) {
              this.eat(TokenType.ARROW);
              const body = this.expression();

              return {
                type: "LambdaExpression",
                params,
                body,
              } as LambdaExpressionNode;
            }
          }

          // Not a lambda, rewind and try as parenthesized expression
          this.position = startPosition;
          this.currentToken = this.tokens[this.position];
          return this.parenthesizedExpression();
        } catch (e) {
          // Error parsing as lambda, rewind and try as parenthesized expression
          this.position = startPosition;
          this.currentToken = this.tokens[this.position];
          return this.parenthesizedExpression();
        }
      case TokenType.LBRACKET:
        return this.arrayLiteral();
      case TokenType.LBRACE:
        return this.objectLiteral();
      case TokenType.FUNCTION:
        return this.functionExpression();
      default:
        throw new Error(
          `Unexpected token: ${this.currentToken.type} at line ${this.currentToken.line}, column ${this.currentToken.column}`
        );
    }
  }

  private numberLiteral(): NumberLiteralNode {
    const token = this.eat(TokenType.NUMBER);
    // Type checking with TS
    if (typeof token.value !== "number") {
      throw new Error(`Expected number, got ${typeof token.value}`);
    }

    return {
      type: "NumberLiteral",
      value: token.value,
    } as NumberLiteralNode;
  }

  private stringLiteral(): StringLiteralNode {
    const token = this.eat(TokenType.STRING);
    // Type checking with TS
    if (typeof token.value !== "string") {
      throw new Error(`Expected string, got ${typeof token.value}`);
    }

    return {
      type: "StringLiteral",
      value: token.value,
    } as StringLiteralNode;
  }

  private booleanLiteral(): BooleanLiteralNode {
    const token = this.eat(TokenType.BOOLEAN);
    // Type checking with TS
    if (typeof token.value !== "boolean") {
      throw new Error(`Expected boolean, got ${typeof token.value}`);
    }

    return {
      type: "BooleanLiteral",
      value: token.value,
    } as BooleanLiteralNode;
  }

  private identifier(): IdentifierNode {
    const token = this.eat(TokenType.IDENTIFIER);
    // Type checking with TS
    if (typeof token.value !== "string") {
      throw new Error(
        `Expected identifier name to be string, got ${typeof token.value}`
      );
    }

    return {
      type: "Identifier",
      name: token.value,
    } as IdentifierNode;
  }

  private parenthesizedExpression(): ASTNode {
    this.eat(TokenType.LPAREN);

    // If we immediately see a right parenthesis, it's an empty parenthesized expression
    if (this.match(TokenType.RPAREN)) {
      this.eat(TokenType.RPAREN);

      // Check if this is a lambda expression with empty parameters
      if (this.match(TokenType.ARROW)) {
        this.eat(TokenType.ARROW);
        const body = this.expression();

        return {
          type: "LambdaExpression",
          params: [],
          body,
        } as LambdaExpressionNode;
      }

      return {
        type: "BooleanLiteral",
        value: true,
      } as BooleanLiteralNode;
    }

    // Otherwise, evaluate the expression inside parentheses
    const expr = this.expression();
    this.eat(TokenType.RPAREN);

    // Check if this is a lambda expression
    if (this.match(TokenType.ARROW)) {
      // This is a lambda with a single parameter
      this.eat(TokenType.ARROW);
      const body = this.expression();

      // The expr should be an identifier
      if (expr.type !== "Identifier") {
        throw new Error("Lambda parameter must be an identifier");
      }

      return {
        type: "LambdaExpression",
        params: [expr as IdentifierNode],
        body,
      } as LambdaExpressionNode;
    }

    // Regular parenthesized expression
    return expr;
  }

  private arrayLiteral(): ArrayLiteralNode {
    this.eat(TokenType.LBRACKET);
    const elements: ASTNode[] = [];

    if (!this.match(TokenType.RBRACKET)) {
      // Parse first element
      elements.push(this.expression());

      // Parse additional elements if any
      while (this.match(TokenType.COMMA)) {
        this.eat(TokenType.COMMA);
        elements.push(this.expression());
      }
    }

    this.eat(TokenType.RBRACKET);

    return {
      type: "ArrayLiteral",
      elements,
    } as ArrayLiteralNode;
  }

  private objectLiteral(): ObjectLiteralNode {
    this.eat(TokenType.LBRACE);
    const properties: { key: string; value: ASTNode }[] = [];

    while (!this.match(TokenType.RBRACE)) {
      // Handle property key
      let key: string;

      // Allow for string literals as keys
      if (this.match(TokenType.STRING)) {
        const stringToken = this.eat(TokenType.STRING);
        if (typeof stringToken.value !== "string") {
          throw new Error(`Expected string, got ${typeof stringToken.value}`);
        }
        key = stringToken.value;
      } else {
        // Traditional identifier key
        const keyNode = this.identifier();
        key = keyNode.name;
      }

      this.eat(TokenType.COLON);
      const value = this.expression();

      properties.push({ key, value });

      if (this.match(TokenType.COMMA)) {
        this.eat(TokenType.COMMA);
      } else {
        break;
      }
    }

    this.eat(TokenType.RBRACE);

    return {
      type: "ObjectLiteral",
      properties,
    } as ObjectLiteralNode;
  }

  // Function declaration
  private functionDeclaration(): FunctionDeclarationNode {
    this.eat(TokenType.FUNCTION);

    let name: IdentifierNode | null = null;
    if (this.match(TokenType.IDENTIFIER)) {
      name = this.identifier();
    }

    const params = this.functionParameters();
    const body = this.functionBody();

    return {
      type: "FunctionDeclaration",
      name,
      params,
      body,
    } as FunctionDeclarationNode;
  }

  // Function expression (anonymous function)
  private functionExpression(): FunctionDeclarationNode {
    return this.functionDeclaration();
  }

  // Function parameters
  private functionParameters(): IdentifierNode[] {
    this.eat(TokenType.LPAREN);
    const params: IdentifierNode[] = [];

    if (!this.match(TokenType.RPAREN)) {
      // Parse first parameter
      if (this.match(TokenType.AT)) {
        // Shorthand property notation: @name
        this.eat(TokenType.AT);
        const param = this.identifier();
        param.isShorthandProperty = true;

        // Check for type annotation
        if (this.match(TokenType.COLON)) {
          this.eat(TokenType.COLON);
          param.typeAnnotation = this.parseType();
        }
        // Check for default value
        else if (this.match(TokenType.ASSIGN)) {
          this.eat(TokenType.ASSIGN);
          // Store the default value expression
          param.defaultValue = this.expression();
        }

        params.push(param);
      } else {
        const param = this.identifier();

        // Check for type annotation
        if (this.match(TokenType.COLON)) {
          this.eat(TokenType.COLON);
          param.typeAnnotation = this.parseType();
        }
        // Check for default value
        else if (this.match(TokenType.ASSIGN)) {
          this.eat(TokenType.ASSIGN);
          // Store the default value expression
          param.defaultValue = this.expression();
        }
        // Check for const assignment (which is invalid for parameters)
        else if (this.match(TokenType.CONST_ASSIGN)) {
          throw new Error("Parameters cannot be defined as constants");
        }

        params.push(param);
      }

      // Parse additional parameters if any
      while (this.match(TokenType.COMMA)) {
        this.eat(TokenType.COMMA);
        if (this.match(TokenType.AT)) {
          // Shorthand property notation: @name
          this.eat(TokenType.AT);
          const param = this.identifier();
          param.isShorthandProperty = true;

          // Check for type annotation
          if (this.match(TokenType.COLON)) {
            this.eat(TokenType.COLON);
            param.typeAnnotation = this.parseType();
          }
          // Check for default value
          else if (this.match(TokenType.ASSIGN)) {
            this.eat(TokenType.ASSIGN);
            // Store the default value expression
            param.defaultValue = this.expression();
          }

          params.push(param);
        } else {
          const param = this.identifier();

          // Check for type annotation
          if (this.match(TokenType.COLON)) {
            this.eat(TokenType.COLON);
            param.typeAnnotation = this.parseType();
          }
          // Check for default value
          else if (this.match(TokenType.ASSIGN)) {
            this.eat(TokenType.ASSIGN);
            // Store the default value expression
            param.defaultValue = this.expression();
          }
          // Check for const assignment (which is invalid for parameters)
          else if (this.match(TokenType.CONST_ASSIGN)) {
            throw new Error("Parameters cannot be defined as constants");
          }

          params.push(param);
        }
      }
    }

    this.eat(TokenType.RPAREN);
    return params;
  }

  // Function body
  private functionBody(): ASTNode[] {
    const body: ASTNode[] = [];

    // Check if it's a one-line lambda function with arrow
    if (this.match(TokenType.ARROW)) {
      this.eat(TokenType.ARROW);
      body.push({
        type: "ReturnStatement",
        argument: this.expression(),
      } as ReturnStatementNode);
      this.optionalSemicolon();
      return body;
    }

    // Regular function body
    while (!this.match(TokenType.END)) {
      body.push(this.statement());
    }

    this.eat(TokenType.END);
    this.optionalSemicolon();

    return body;
  }

  // Class declaration
  private classDeclaration(): ClassDeclarationNode {
    this.eat(TokenType.CLASS);
    const name = this.identifier();

    let superClass: IdentifierNode | null = null;
    if (this.match(TokenType.EXTENDS)) {
      this.eat(TokenType.EXTENDS);
      superClass = this.identifier();
    }

    const body: ASTNode[] = [];

    while (!this.match(TokenType.END)) {
      if (this.match(TokenType.CONSTRUCTOR)) {
        body.push(this.constructorDefinition());
      } else if (this.match(TokenType.PROPERTY)) {
        body.push(this.propertyDeclaration());
      } else if (this.match(TokenType.STATIC)) {
        // Handle static methods or properties
        this.eat(TokenType.STATIC);

        // Check if it's a method or property
        if (this.match(TokenType.IDENTIFIER)) {
          const identifier = this.identifier();

          if (this.match(TokenType.LPAREN)) {
            // It's a static method
            const params = this.functionParameters();
            const methodBody = this.functionBody();

            body.push({
              type: "MethodDefinition",
              name: identifier,
              function: {
                type: "FunctionDeclaration",
                name: null,
                params,
                body: methodBody,
              },
              isStatic: true,
              isConstructor: false,
              isPrivate: false,
              isProtected: false,
            } as MethodDefinitionNode);
          } else if (
            this.match(TokenType.ASSIGN) ||
            this.match(TokenType.CONST_ASSIGN)
          ) {
            // It's a static property
            const isConstant = this.match(TokenType.CONST_ASSIGN);
            this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);

            const value = this.expression();
            this.optionalSemicolon();

            body.push({
              type: "PropertyDefinition",
              name: identifier,
              value,
              isStatic: true,
              isPrivate: false,
              isProtected: false,
              isConstant,
            } as PropertyDefinitionNode);
          } else {
            throw new Error(
              `Expected '(' or '=' after static identifier at line ${this.currentToken.line}, column ${this.currentToken.column}`
            );
          }
        } else {
          throw new Error(
            `Expected identifier after 'static' keyword at line ${this.currentToken.line}, column ${this.currentToken.column}`
          );
        }
      } else if (this.match(TokenType.PRIVATE)) {
        // Handle private methods or properties
        this.eat(TokenType.PRIVATE);

        if (this.match(TokenType.IDENTIFIER)) {
          const identifier = this.identifier();

          if (this.match(TokenType.LPAREN)) {
            // It's a private method
            const params = this.functionParameters();
            const methodBody = this.functionBody();

            body.push({
              type: "MethodDefinition",
              name: identifier,
              function: {
                type: "FunctionDeclaration",
                name: null,
                params,
                body: methodBody,
              },
              isStatic: false,
              isConstructor: false,
              isPrivate: true,
              isProtected: false,
            } as MethodDefinitionNode);
          } else if (
            this.match(TokenType.ASSIGN) ||
            this.match(TokenType.CONST_ASSIGN)
          ) {
            // It's a private property
            const isConstant = this.match(TokenType.CONST_ASSIGN);
            this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);

            const value = this.expression();
            this.optionalSemicolon();

            body.push({
              type: "PropertyDefinition",
              name: identifier,
              value,
              isStatic: false,
              isPrivate: true,
              isProtected: false,
              isConstant,
            } as PropertyDefinitionNode);
          } else {
            throw new Error(
              `Expected '(' or '=' after private identifier at line ${this.currentToken.line}, column ${this.currentToken.column}`
            );
          }
        } else {
          throw new Error(
            `Expected identifier after 'private' keyword at line ${this.currentToken.line}, column ${this.currentToken.column}`
          );
        }
      } else if (this.match(TokenType.PROTECTED)) {
        // Handle protected methods or properties
        this.eat(TokenType.PROTECTED);

        if (this.match(TokenType.IDENTIFIER)) {
          const identifier = this.identifier();

          if (this.match(TokenType.LPAREN)) {
            // It's a protected method
            const params = this.functionParameters();
            const methodBody = this.functionBody();

            body.push({
              type: "MethodDefinition",
              name: identifier,
              function: {
                type: "FunctionDeclaration",
                name: null,
                params,
                body: methodBody,
              },
              isStatic: false,
              isConstructor: false,
              isPrivate: false,
              isProtected: true,
            } as MethodDefinitionNode);
          } else if (
            this.match(TokenType.ASSIGN) ||
            this.match(TokenType.CONST_ASSIGN)
          ) {
            // It's a protected property
            const isConstant = this.match(TokenType.CONST_ASSIGN);
            this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);

            const value = this.expression();
            this.optionalSemicolon();

            body.push({
              type: "PropertyDefinition",
              name: identifier,
              value,
              isStatic: false,
              isPrivate: false,
              isProtected: true,
              isConstant,
            } as PropertyDefinitionNode);
          } else {
            throw new Error(
              `Expected '(' or '=' after protected identifier at line ${this.currentToken.line}, column ${this.currentToken.column}`
            );
          }
        } else {
          throw new Error(
            `Expected identifier after 'protected' keyword at line ${this.currentToken.line}, column ${this.currentToken.column}`
          );
        }
      } else if (this.match(TokenType.CONST)) {
        body.push(this.propertyDefinition());
      } else if (this.match(TokenType.IDENTIFIER)) {
        // Check if it's a property assignment or method definition
        const savedPosition = this.position;
        const identifier = this.identifier();

        if (
          this.match(TokenType.ASSIGN) ||
          this.match(TokenType.CONST_ASSIGN)
        ) {
          // It's a property assignment
          const isConstant =
            (this.currentToken.type as string) ===
            (TokenType.CONST_ASSIGN as string);
          this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);

          const value = this.expression();
          this.optionalSemicolon();

          body.push({
            type: "PropertyDefinition",
            name: identifier,
            value,
            isStatic: false,
            isPrivate: false,
            isProtected: false,
            isConstant,
          } as PropertyDefinitionNode);
        } else {
          // Rewind and parse as method
          this.position = savedPosition;
          this.currentToken = this.tokens[this.position];
          body.push(this.methodDefinition(false, false, false));
        }
      } else {
        throw new Error(
          `Unexpected token in class body: ${this.currentToken.type} at line ${this.currentToken.line}, column ${this.currentToken.column}`
        );
      }
    }

    this.eat(TokenType.END);
    this.optionalSemicolon();

    return {
      type: "ClassDeclaration",
      name,
      superClass,
      body,
    } as ClassDeclarationNode;
  }

  // Constructor definition
  private constructorDefinition(): MethodDefinitionNode {
    this.eat(TokenType.CONSTRUCTOR);

    const name: IdentifierNode = {
      type: "Identifier",
      name: "constructor",
    };

    const params = this.functionParameters();
    const body = this.functionBody();

    return {
      type: "MethodDefinition",
      name,
      function: {
        type: "FunctionDeclaration",
        name: null,
        params,
        body,
      },
      isStatic: false,
      isConstructor: true,
      isPrivate: false,
      isProtected: false,
    } as MethodDefinitionNode;
  }

  // Property definition (static, private, const)
  private propertyDefinition(): PropertyDefinitionNode {
    let isStatic = false;
    let isPrivate = false;
    let isProtected = false;
    let isConstant = false;

    if (this.match(TokenType.STATIC)) {
      this.eat(TokenType.STATIC);
      isStatic = true;
    }

    if (this.match(TokenType.PRIVATE)) {
      this.eat(TokenType.PRIVATE);
      isPrivate = true;
    }

    if (this.match(TokenType.PROTECTED)) {
      this.eat(TokenType.PROTECTED);
      isProtected = true;
    }

    if (this.match(TokenType.CONST)) {
      this.eat(TokenType.CONST);
      isConstant = true;
    }

    const name = this.identifier();

    let value: ASTNode | null = null;
    if (this.match(TokenType.ASSIGN) || this.match(TokenType.CONST_ASSIGN)) {
      isConstant = isConstant || this.match(TokenType.CONST_ASSIGN);
      this.eat(isConstant ? TokenType.CONST_ASSIGN : TokenType.ASSIGN);
      value = this.expression();
    }

    this.optionalSemicolon();

    return {
      type: "PropertyDefinition",
      name,
      value,
      isStatic,
      isPrivate,
      isProtected,
      isConstant,
    } as PropertyDefinitionNode;
  }

  // Property declaration with getter/setter
  private propertyDeclaration(): PropertyDeclarationNode {
    this.eat(TokenType.PROPERTY);
    const name = this.identifier();

    let getter: FunctionDeclarationNode | LambdaExpressionNode | null = null;
    let setter: FunctionDeclarationNode | LambdaExpressionNode | null = null;

    while (!this.match(TokenType.END)) {
      if (this.match(TokenType.GET)) {
        this.eat(TokenType.GET);

        // Check if it's a lambda expression
        if (this.match(TokenType.LPAREN)) {
          this.eat(TokenType.LPAREN);
          this.eat(TokenType.RPAREN);

          if (this.match(TokenType.ARROW)) {
            this.eat(TokenType.ARROW);
            const body = this.expression();

            getter = {
              type: "LambdaExpression",
              params: [],
              body,
            } as LambdaExpressionNode;

            this.optionalSemicolon();
          } else {
            // Regular function
            getter = {
              type: "FunctionDeclaration",
              name: null,
              params: [],
              body: this.functionBody(),
            } as FunctionDeclarationNode;
          }
        } else {
          // Regular function without parentheses
          const body = this.functionBody();
          getter = {
            type: "FunctionDeclaration",
            name: null,
            params: [],
            body,
          } as FunctionDeclarationNode;
        }
      } else if (this.match(TokenType.SET)) {
        this.eat(TokenType.SET);

        // Check if it's a lambda expression
        if (this.match(TokenType.LPAREN)) {
          const params = this.functionParameters();

          if (this.match(TokenType.ARROW)) {
            this.eat(TokenType.ARROW);
            const body = this.expression();

            setter = {
              type: "LambdaExpression",
              params,
              body,
            } as LambdaExpressionNode;

            this.optionalSemicolon();
          } else {
            // Regular function
            setter = {
              type: "FunctionDeclaration",
              name: null,
              params,
              body: this.functionBody(),
            } as FunctionDeclarationNode;
          }
        } else {
          // Error: setter must have a parameter
          throw new Error(
            `Setter must have a parameter at line ${this.currentToken.line}, column ${this.currentToken.column}`
          );
        }
      } else {
        throw new Error(
          `Unexpected token in property declaration: ${this.currentToken.type} at line ${this.currentToken.line}, column ${this.currentToken.column}`
        );
      }
    }

    this.eat(TokenType.END);
    this.optionalSemicolon();

    return {
      type: "PropertyDeclaration",
      name,
      getter,
      setter,
    } as PropertyDeclarationNode;
  }

  // Method definition
  private methodDefinition(
    isStatic: boolean,
    isPrivate: boolean = false,
    isProtected: boolean = false
  ): MethodDefinitionNode {
    const name = this.identifier();
    const params = this.functionParameters();
    const body = this.functionBody();

    return {
      type: "MethodDefinition",
      name,
      function: {
        type: "FunctionDeclaration",
        name: null,
        params,
        body,
      },
      isStatic,
      isConstructor: false,
      isPrivate,
      isProtected,
    } as MethodDefinitionNode;
  }

  // If statement
  private ifStatement(): IfStatementNode {
    this.eat(TokenType.IF);
    const test = this.expression();

    const consequent: ASTNode[] = [];

    while (!this.match(TokenType.END)) {
      consequent.push(this.statement());
    }

    this.eat(TokenType.END);

    let alternate: ASTNode[] | null = null;

    if (this.match(TokenType.ELSE)) {
      this.eat(TokenType.ELSE);

      // Check if it's an "else if"
      if (this.match(TokenType.IF)) {
        alternate = [this.ifStatement()];
      } else {
        alternate = [];

        while (!this.match(TokenType.END)) {
          alternate.push(this.statement());
        }

        this.eat(TokenType.END);
      }
    }

    this.optionalSemicolon();

    return {
      type: "IfStatement",
      test,
      consequent,
      alternate,
    } as IfStatementNode;
  }

  // Return statement
  private returnStatement(): ReturnStatementNode {
    this.eat(TokenType.RETURN);

    let argument: ASTNode | null = null;
    if (!this.match(TokenType.SEMICOLON) && !this.match(TokenType.END)) {
      argument = this.expression();
    }

    this.optionalSemicolon();

    return {
      type: "ReturnStatement",
      argument,
    } as ReturnStatementNode;
  }

  // Import declaration
  private importDeclaration(): ImportDeclarationNode {
    this.eat(TokenType.IMPORT);

    const specifiers: IdentifierNode[] = [];

    specifiers.push(this.identifier());

    while (this.match(TokenType.COMMA)) {
      this.eat(TokenType.COMMA);
      specifiers.push(this.identifier());
    }

    this.eat(TokenType.FROM);
    const source = this.stringLiteral();

    this.optionalSemicolon();

    return {
      type: "ImportDeclaration",
      specifiers,
      source,
    } as ImportDeclarationNode;
  }

  // Export declaration
  private exportDeclaration(): ExportDeclarationNode {
    this.eat(TokenType.EXPORT);

    let declaration: ASTNode;

    if (this.match(TokenType.CLASS)) {
      declaration = this.classDeclaration();
    } else if (this.match(TokenType.FUNCTION)) {
      declaration = this.functionDeclaration();
    } else {
      declaration = this.expression();
      this.optionalSemicolon();
    }

    return {
      type: "ExportDeclaration",
      declaration,
    } as ExportDeclarationNode;
  }

  // Lambda expression
  private lambdaExpression(): LambdaExpressionNode {
    const params: IdentifierNode[] = [];

    // Check for parameters in parentheses
    if (this.match(TokenType.LPAREN)) {
      this.eat(TokenType.LPAREN);

      // Empty parameter list
      if (!this.match(TokenType.RPAREN)) {
        // Parse first parameter
        if (this.match(TokenType.IDENTIFIER)) {
          const param = this.identifier();

          // Check for type annotation
          if (this.match(TokenType.COLON)) {
            this.eat(TokenType.COLON);
            param.typeAnnotation = this.parseType();
          }
          // Check for default value
          else if (this.match(TokenType.ASSIGN)) {
            this.eat(TokenType.ASSIGN);
            param.defaultValue = this.expression();
          }

          params.push(param);

          // Parse additional parameters
          while (this.match(TokenType.COMMA)) {
            this.eat(TokenType.COMMA);
            if (this.match(TokenType.IDENTIFIER)) {
              const additionalParam = this.identifier();

              // Check for type annotation
              if (this.match(TokenType.COLON)) {
                this.eat(TokenType.COLON);
                additionalParam.typeAnnotation = this.parseType();
              }
              // Check for default value
              else if (this.match(TokenType.ASSIGN)) {
                this.eat(TokenType.ASSIGN);
                additionalParam.defaultValue = this.expression();
              }

              params.push(additionalParam);
            } else {
              throw new Error(
                "Expected identifier after comma in lambda parameters"
              );
            }
          }
        } else {
          throw new Error("Expected identifier in lambda parameters");
        }
      }

      this.eat(TokenType.RPAREN);
    }
    // Single parameter without parentheses
    else if (this.match(TokenType.IDENTIFIER)) {
      params.push(this.identifier());

      // Single parameters without parentheses cannot have type annotations in Jacques
      if (this.match(TokenType.COLON)) {
        throw new Error("Parameter type annotations require parentheses");
      }
    } else {
      throw new Error(
        "Expected parameter list or identifier for lambda expression"
      );
    }

    // Arrow token
    this.eat(TokenType.ARROW);

    // Lambda body
    const body = this.expression();

    return {
      type: "LambdaExpression",
      params,
      body,
    } as LambdaExpressionNode;
  }

  private block(): ASTNode[] {
    this.eat(TokenType.LBRACE);
    const statements: ASTNode[] = [];

    while (!this.match(TokenType.RBRACE)) {
      statements.push(this.statement());
    }

    this.eat(TokenType.RBRACE);
    return statements;
  }
}
