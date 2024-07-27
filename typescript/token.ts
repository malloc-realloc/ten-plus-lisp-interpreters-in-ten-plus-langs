import exp from "constants";
import { cons } from "./builtins";

export function preprocessString(expr: string): string {
  // Use a regular expression with global replacement to handle all instances of `(
  expr = expr.replace(/`\(/g, "(quote "); // global search

  // Regular expression to handle different patterns preceded by a backtick
  expr = expr.replace(/`([\w+\-*/!@#$%^&=<>?]+|[^\s\(\)]+)/g, "(quote $1)");

  expr = expr.replace(/\(/g, "( ").replace(/\)/g, " )");
  // expr = expr.replace(/\{/g, "{ ").replace(/\}/g, " }");
  // expr = expr.replace(/\"/g, ' " ');

  // expr = expr.replace(/\s+/g, " ").trim();

  return expr;
}

export function tokenize(expr: string): string[] {
  expr = preprocessString(expr);

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
}
