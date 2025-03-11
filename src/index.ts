import { JacquesValue } from "./JacquesValue";
import { Lexer } from "./Lexer";
import { Parser } from "./Parser";
import { Interpreter, type Environment } from "./Interpreter";
import type { Token } from "./Token";

export class Jacques {
  static run(code: string): JacquesValue | null {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const interpreter = new Interpreter(ast);
    return interpreter.execute();
  }

  static runDebug(code: string): {
    tokens: Token[];
    ast: any;
    result: JacquesValue | null;
    env: Environment;
  } {
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
  }
}
