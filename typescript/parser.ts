import { Expr, ExprType, Atom } from './ast';
import { tokenize } from './token';

export function parseExpr(tokens: string[]): Expr {
    let token = tokens.shift(); // 获取并移除第一个token
    if (!token) {
        throw new Error('Unexpected end of tokens');
    }

    if (token === "{") {
      let text = ""
      while (tokens[0] !== "}") {
        if (!tokens[0]) {
          throw new Error('Unexpected end of tokens');
        }
        text += tokens[0]
        text += " "
        tokens.shift()
      }
      const llmExpr: Expr = new Expr(ExprType.LLM_EXPR, text as Atom)
      return llmExpr
    }

    if (token === "(") {
        const lstExpr: Expr[] = [];
        while (tokens[0] !== ")") {
            if (!tokens[0]) {
                throw new Error('Unexpected end of tokens');
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

let temp = [
    "(cons `a `3)",
    "(define shit (quote + 1 1))",
    "{你好 [a] 哈哈 hello world !}"
]
let tokens: string[][]  = []
temp.forEach(ele => {
  tokens.push(tokenize(ele))
})
tokens.forEach(ele => {
  console.log(parseExpr(ele).toString())
})
