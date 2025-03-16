import type { Token } from "./Token";
import { TokenType } from "./Token";
import { convertToString } from "./utils";

export class Lexer {
  private input: string;
  private position = 0;
  private line = 1;
  private column = 1;
  private currentChar: string | null = null;

  private keywords: Record<string, TokenType> = {
    function: TokenType.FUNCTION,
    class: TokenType.CLASS,
    extends: TokenType.EXTENDS,
    if: TokenType.IF,
    else: TokenType.ELSE,
    end: TokenType.END,
    return: TokenType.RETURN,
    constructor: TokenType.CONSTRUCTOR,
    property: TokenType.PROPERTY,
    get: TokenType.GET,
    set: TokenType.SET,
    static: TokenType.STATIC,
    private: TokenType.PRIVATE,
    protected: TokenType.PROTECTED,
    const: TokenType.CONST,
    self: TokenType.SELF,
    Result: TokenType.RESULT,
    import: TokenType.IMPORT,
    export: TokenType.EXPORT,
    from: TokenType.FROM,
    while: TokenType.WHILE,
    true: TokenType.BOOLEAN,
    false: TokenType.BOOLEAN,
  };

  constructor(input: string) {
    this.input = input;
    this.currentChar = this.input.length > 0 ? this.input[0] : null;
  }

  private advance(): string | null {
    this.position++;

    if (this.currentChar === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    if (this.position >= this.input.length) {
      this.currentChar = null;
    } else {
      this.currentChar = this.input[this.position];
    }

    return this.currentChar;
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  // Helper method that safely checks if currentChar equals a specific character
  private isCurrentChar(c: string): boolean {
    return this.currentChar === c;
  }

  // Helper method that safely checks if currentChar is a newline
  private isNewline(): boolean {
    return this.currentChar === "\n";
  }

  private skipComment(): void {
    // Check for line comments
    if (this.isCurrentChar("/") && this.peek() === "/") {
      // Consume the // characters
      this.advance();
      this.advance();

      // Skip until end of line or end of file
      while (this.currentChar !== null) {
        if (this.isNewline()) break;
        this.advance();
      }

      // Consume the newline character if present
      if (this.isNewline()) {
        this.advance();
      }
    } else if (this.isCurrentChar("/") && this.peek() === "*") {
      this.advance(); // Consume /
      this.advance(); // Consume *
      this.skipMultilineComment();
    }
  }

  private skipMultilineComment(): void {
    // Skip until */ is found
    let nesting = 1;

    while (nesting > 0 && this.currentChar !== null) {
      if (this.isCurrentChar("*") && this.peek() === "/") {
        this.advance();
        this.advance();
        nesting--;
      } else if (this.isCurrentChar("/") && this.peek() === "*") {
        this.advance();
        this.advance();
        nesting++;
      } else {
        this.advance();
      }
    }

    if (nesting > 0) {
      throw new Error(
        `Unterminated multiline comment at line ${convertToString(
          this.line
        )}, column ${convertToString(this.column)}`
      );
    }
  }

  private peek(n = 1): string | null {
    const peekPos = this.position + n;
    if (peekPos >= this.input.length) {
      return null;
    }
    return this.input[peekPos];
  }

  private number(): Token {
    let result = "";
    const line = this.line;
    const column = this.column;

    while (this.currentChar !== null && /[0-9.]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value: parseFloat(result),
      line,
      column,
    };
  }

  private string(): Token {
    const quote = this.currentChar;
    if (quote === null) {
      throw new Error(
        `Expected quote character at line ${convertToString(
          this.line
        )}, column ${convertToString(this.column)}`
      );
    }

    this.advance(); // Skip the opening quote

    let result = "";
    const line = this.line;
    const column = this.column - 1;

    // Handle escape sequences
    if (this.currentChar === null) {
      throw new Error(
        `Unterminated escape sequence at line ${convertToString(
          this.line
        )}, column ${convertToString(this.column)}`
      );
    }

    while (this.currentChar !== quote) {
      if (this.isCurrentChar("\\")) {
        this.advance(); // Skip the backslash

        // Use isCurrentChar function to check character
        if (this.isCurrentChar("n")) {
          result += "\n";
        } else if (this.isCurrentChar("t")) {
          result += "\t";
        } else if (this.isCurrentChar("r")) {
          result += "\r";
        } else if (this.isCurrentChar("\\")) {
          result += "\\";
        } else if (this.isCurrentChar('"')) {
          result += '"';
        } else if (this.isCurrentChar("'")) {
          result += "'";
        } else {
          result += this.currentChar; // Keep the character as-is
        }
      } else {
        result += this.currentChar;
      }
      this.advance();
    }

    // if (this.currentChar === null) {
    //   throw new Error(
    //     `Unterminated string starting at line ${convertToString(
    //       line
    //     )}, column ${convertToString(column)}`
    //   );
    // }

    this.advance(); // Skip the closing quote

    return {
      type: TokenType.STRING,
      value: result,
      line,
      column,
    };
  }

  private identifier(): Token {
    let result = "";
    const line = this.line;
    const column = this.column;

    while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    const type = this.keywords[result] ?? TokenType.IDENTIFIER;
    let value: string | boolean = result;

    if (type === TokenType.BOOLEAN) {
      value = result === "true";
    }

    return {
      type,
      value,
      line,
      column,
    };
  }

  public getNextToken(): Token {
    // Skip any whitespace and comments before getting the next token
    this.skipWhitespace();
    this.skipComment();

    // If we've reached the end of input, return an EOF token
    if (this.currentChar === null) {
      return {
        type: TokenType.EOF,
        value: null,
        line: this.line,
        column: this.column,
      };
    }

    // Check for string literals
    if (this.isCurrentChar('"') || this.isCurrentChar("'")) {
      return this.string();
    }

    // Check for numeric literals
    if (/[0-9]/.test(this.currentChar)) {
      return this.number();
    }

    // Check for identifiers and keywords
    if (/[a-zA-Z_]/.test(this.currentChar)) {
      return this.identifier();
    }

    // Check for operators and other symbols
    const line = this.line;
    const column = this.column;

    // Check for increment operator (++)
    if (this.isCurrentChar("+") && this.peek() === "+") {
      this.advance(); // Skip first +
      this.advance(); // Skip second +
      return {
        type: TokenType.INCREMENT,
        value: "++",
        line,
        column,
      };
    }

    // Check for other operators
    switch (this.currentChar) {
      case "+":
        this.advance();
        return {
          type: TokenType.PLUS,
          value: "+",
          line,
          column,
        };

      case "-":
        this.advance();
        if (this.isCurrentChar(">")) {
          this.advance();
          return { type: TokenType.ARROW, value: "=>", line, column };
        }
        return { type: TokenType.MINUS, value: "-", line, column };

      case "@":
        this.advance();
        return { type: TokenType.AT, value: "@", line, column };

      case "*":
        this.advance();
        return { type: TokenType.MULTIPLY, value: "*", line, column };

      case "/":
        this.advance();
        return { type: TokenType.DIVIDE, value: "/", line, column };

      case "%":
        this.advance();
        return { type: TokenType.MODULO, value: "%", line, column };

      case "=":
        this.advance();
        if (this.isCurrentChar("=")) {
          this.advance();
          return { type: TokenType.EQUALS, value: "==", line, column };
        } else if (this.isCurrentChar(">")) {
          this.advance();
          return { type: TokenType.ARROW, value: "=>", line, column };
        }
        return { type: TokenType.ASSIGN, value: "=", line, column };

      case "!":
        this.advance();
        if (this.isCurrentChar("=")) {
          this.advance();
          return { type: TokenType.NOT_EQUALS, value: "!=", line, column };
        }
        return { type: TokenType.NOT, value: "!", line, column };

      case "<":
        this.advance();
        if (this.isCurrentChar("=")) {
          this.advance();
          return {
            type: TokenType.LESS_THAN_OR_EQUAL,
            value: "<=",
            line,
            column,
          };
        }
        return { type: TokenType.LESS_THAN, value: "<", line, column };

      case ">":
        this.advance();
        if (this.isCurrentChar("=")) {
          this.advance();
          return {
            type: TokenType.GREATER_THAN_OR_EQUAL,
            value: ">=",
            line,
            column,
          };
        }
        return { type: TokenType.GREATER_THAN, value: ">", line, column };

      case "&":
        this.advance();
        if (this.isCurrentChar("&")) {
          this.advance();
          return { type: TokenType.AND, value: "&&", line, column };
        }
        throw new Error(`Unexpected character: &`);

      case "|":
        this.advance();
        if (this.isCurrentChar("|")) {
          this.advance();
          return { type: TokenType.OR, value: "||", line, column };
        }
        throw new Error(`Unexpected character: |`);

      case "(":
        this.advance();
        return { type: TokenType.LPAREN, value: "(", line, column };

      case ")":
        this.advance();
        return { type: TokenType.RPAREN, value: ")", line, column };

      case "{":
        this.advance();
        return { type: TokenType.LBRACE, value: "{", line, column };

      case "}":
        this.advance();
        return { type: TokenType.RBRACE, value: "}", line, column };

      case "[":
        this.advance();
        return { type: TokenType.LBRACKET, value: "[", line, column };

      case "]":
        this.advance();
        return { type: TokenType.RBRACKET, value: "]", line, column };

      case ":":
        this.advance();
        if (this.isCurrentChar("=")) {
          this.advance();
          return { type: TokenType.CONST_ASSIGN, value: ":=", line, column };
        }
        return { type: TokenType.COLON, value: ":", line, column };

      case ";":
        this.advance();
        return { type: TokenType.SEMICOLON, value: ";", line, column };

      case ",":
        this.advance();
        return { type: TokenType.COMMA, value: ",", line, column };

      case ".":
        this.advance();
        return { type: TokenType.DOT, value: ".", line, column };

      default: {
        // If character is whitespace, skip it and get next token
        if (/\s/.test(this.currentChar)) {
          this.advance();
          return this.getNextToken();
        }

        // Better error message with character code for invisible characters
        const charCode = this.currentChar.charCodeAt(0);
        throw new Error(
          `Unexpected character: '${
            this.currentChar
          }' (charCode: ${convertToString(charCode)}) at line ${convertToString(
            line
          )}, column ${convertToString(column)}`
        );
      }
    }

    // This should never happen if all cases are handled correctly
    throw new Error(
      `Unexpected end of input at line ${convertToString(
        line
      )}, column ${convertToString(column)}`
    );
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.getNextToken();

    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.getNextToken();
    }

    tokens.push(token); // Add EOF token
    return tokens;
  }
}
