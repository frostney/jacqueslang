export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENTIFIER = "IDENTIFIER",
  BOOLEAN = "BOOLEAN",

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  MULTIPLY = "MULTIPLY",
  DIVIDE = "DIVIDE",
  MODULO = "MODULO",

  // Comparison
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",

  // Logical
  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Assignment
  ASSIGN = "ASSIGN", // =
  CONST_ASSIGN = "CONST_ASSIGN", // :=

  // Delimiters
  LPAREN = "LPAREN", // (
  RPAREN = "RPAREN", // )
  LBRACE = "LBRACE", // {
  RBRACE = "RBRACE", // }
  LBRACKET = "LBRACKET", // [
  RBRACKET = "RBRACKET", // ]
  COLON = "COLON", // :
  SEMICOLON = "SEMICOLON", // ;
  COMMA = "COMMA", // ,
  DOT = "DOT", // .
  ARROW = "ARROW", // =>
  AT = "AT", // @

  // Keywords
  FUNCTION = "FUNCTION",
  CLASS = "CLASS",
  EXTENDS = "EXTENDS",
  IF = "IF",
  ELSE = "ELSE",
  END = "END",
  RETURN = "RETURN",
  CONSTRUCTOR = "CONSTRUCTOR",
  PROPERTY = "PROPERTY",
  GET = "GET",
  SET = "SET",
  STATIC = "STATIC",
  PRIVATE = "PRIVATE",
  CONST = "CONST",
  SELF = "SELF",
  RESULT = "RESULT",
  IMPORT = "IMPORT",
  EXPORT = "EXPORT",
  FROM = "FROM",
  WHILE = "WHILE",

  // Special
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string | number | boolean | null;
  line: number;
  column: number;
}
