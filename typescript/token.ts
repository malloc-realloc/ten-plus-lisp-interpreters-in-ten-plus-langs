import { Env } from "./env";

export function preprocessString(env: Env, expr: string): string {
  // works like builtin macro
  // Use a regular expression with global replacement to handle all instances of `(
  expr = expr.replace(/`\(/g, "(quote "); // global search

  // Regular expression to handle different patterns preceded by a backtick
  expr = expr.replace(/`([\w+\-*/!@#$%^&=<>?]+|[^\s\(\)]+)/g, "(quote $1)");

  expr = expr.replace(/\(/g, "( ").replace(/\)/g, " )");

  for (let i = 0; i < env.macros.length; i++) {
    expr = expr.replace(env.macros[i][0], env.macros[i][1]);
  }

  return expr;
}

export function tokenize(env: Env, expr: string): string[] {
  try {
    expr = preprocessString(env, expr);

    const result: string[] = [];

    for (let i = 0; i < expr.length; i++) {
      // skip spaces
      if (expr[i] === " ") {
        continue;
      } else if (expr[i] === "(" || expr[i] === ")") {
        result.push(expr[i]);
      } else if (expr[i] === '"') {
        let token = "";
        result.push('"');

        i++;
        while (expr[i] !== '"') {
          token += expr[i];
          i++;
        }
        result.push(token);
        result.push('"');
      } else if (expr[i] === "{") {
        let token = "";
        result.push("{");

        i++;
        while (expr[i] !== "}") {
          token += expr[i];
          i++;
        }
        result.push(token);
        result.push("}");
      } else if (expr[i] === "'") {
        // '' contains comments
        i++;
        while (1) {
          if (expr[i] === "'") {
            break;
          }
          i++;
        }
      } else {
        let token = "";
        while (i < expr.length && expr[i] !== " " && expr[i] !== ")") {
          token += expr[i];
          i++;
        }
        i--;
        result.push(token);
      }
    }

    return result;
  } catch (error) {
    return [];
  }
}
