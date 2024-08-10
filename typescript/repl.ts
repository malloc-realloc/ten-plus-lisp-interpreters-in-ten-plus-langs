// src/repl.ts
import { tokenize } from "./token"; // 假设 tokenize 函数在 token.ts 中定义
import { parseExpr } from "./parser"; // 假设 parseExpr 函数在 parser.ts 中定义
import { evalExpr } from "./eval"; // 假设 evalExpr 函数在 eval.ts 中定义
import { Env } from "./env"; // 假设 Env 类在 env.ts 中定义
import * as readline from "readline";

function repl(): void {
  const globalEnv = new Env();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("tslisp> ");
  rl.prompt();

  rl.on("line", (line: string) => {
    const expr = line.trim();
    if (expr.toLowerCase() === "exit" || expr.toLowerCase() === "quit") {
      rl.close();
      return;
    }

    try {
      const tokenizedExpr = tokenize(expr);
      const ast = parseExpr(tokenizedExpr);
      const resultedObj = evalExpr(globalEnv, ast);

      const result = String(resultedObj.value);
      console.log(result);
    } catch (error: any) {
      console.error("Error:", error.message);
    }

    rl.prompt();
  }).on("close", () => {
    console.log("Exiting tslisp REPL");
    process.exit(0);
  });
}

repl();
