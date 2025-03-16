import { JacquesValue } from "./JacquesValue";
import { Lexer } from "./Lexer";
import { Parser } from "./Parser";
import { Interpreter } from "./Interpreter";
import type { Token } from "./Token";
import type { EnvironmentRecord } from "./Environment";
import type { ProgramNode } from "./ASTNode";

export const run = (code: string): JacquesValue | null => {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  const interpreter = new Interpreter(ast);
  return interpreter.execute();
};

export const runDebug = (
  code: string
): {
  tokens: Token[];
  ast: ProgramNode;
  result: JacquesValue | null;
  env: EnvironmentRecord;
} => {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  const interpreter = new Interpreter(ast);
  const result = interpreter.execute();

  return {
    tokens,
    ast,
    result,
    env: interpreter.environment,
  };
};
