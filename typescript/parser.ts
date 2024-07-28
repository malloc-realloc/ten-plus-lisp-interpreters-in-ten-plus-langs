import { Expr, ExprType, Atom } from "./ast";

export function parseExpr(tokens: string[]): Expr {
  let token = tokens.shift(); // 获取并移除第一个token
  if (!token) {
    throw new Error("Unexpected end of tokens");
  }

  if (token === '"') {
    const expr = new Expr(ExprType.STRING_EXPR, tokens[0] as Atom);
    tokens.shift();
    if (tokens.length > 0)
      tokens.shift();
    return expr;
  }

  if (token === "{") {
    const llmExpr: Expr = new Expr(ExprType.LLM_EXPR, tokens[0] as Atom);
    tokens.shift();
    if (tokens.length > 0)
      tokens.shift();

    return llmExpr;
  }

  if (token === "(") {
    const lstExpr: Expr[] = [];
    while (tokens[0] !== ")") {
      if (!tokens[0]) {
        throw new Error("Unexpected end of tokens");
      }
      const expr = parseExpr(tokens);
      lstExpr.push(expr);
    }
    tokens.shift(); // remove ')'
    return new Expr(ExprType.LST_EXPR, lstExpr);
  } else {
    return new Expr(ExprType.ATOM, token as Atom);
  }
}
