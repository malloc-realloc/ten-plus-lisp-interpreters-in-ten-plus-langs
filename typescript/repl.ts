import { evalStrExprs } from "./eval";
import { Env } from "./env";
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
      const resultedObj = evalStrExprs(globalEnv, expr);

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
