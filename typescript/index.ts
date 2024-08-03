// main.ts
import { tokenize } from "./token";
import { parseExpr } from "./parser";
import { evalExpr } from "./eval";
import { Env } from "./env";
import { Obj } from "./obj";

const globalEnv = new Env();

function evalExpression(expr: string): Obj {
  const tokenizedExpr = tokenize(expr);
  const ast = parseExpr(tokenizedExpr);
  const result: Obj = evalExpr(globalEnv, ast);
  return result;
}

const exprs: string[] = [
  // "(define r 1)",
  // "(define fn (lambda (x) (define r 2) (+ x r)))",
  // "(fn 2)",
  // "(display r)",
  // '(define a "haha")',
  // "{what is the number [a]}",
  "(define a 2)",
  "(define fa (lambda (x) (+ x a)))",
  "(fa 2)",
  "((lambda (x) (+ x 1)) 2)",
  "(define f (lambda (x) (+ 2 x)))",
  "(f 4)",
  "(define higher_level_function (lambda (x) (lambda (y) (+  y x 2))))",
  "(define add2 (higher_level_function 2))",
  "(add2 4)",
  // "(define r 2)",
  // "(define with_r_2 (lambda (x) (+ r x)))",
  // "(with_r_2 10)",
  // "(define r 10)",
  // "(with_r_2 10)",
  // "(if (> -1 0) 2 1)",
  // "(if 0 2 1)", // 0 is consider as TRUE
  // "(define r 10)",
  // "(set! r 2)",
  // "(define e (quote + 1 2))",
  // "(eval e)",
  // "(define qe (quote 1))",
  // "(eval qe)",
  // "(eval (car `(1)))",
  // "(eval (car `(1 1 1 )))",
  // "(eval (cdr `(1 + 1 1)))",
  // "(eval (car `((+ 1  1)) ))",
  // "(cdr (quote 1 2 3))",
  // "(cons `1 `(1 1))",
  // "(cons (quote +) `(1 1 ))",
  // "(cons `+ `(1 1))",
  // "(define 世界 1)",
  // "(display 世界)",
  // "(define temp (cons `a `(1 1)))",
  // "(cons `(a b) `(b c d))", // "(cons `(a b) `(b c d))" is wrong
  // "(cons `(a b) `c)",
  // "(cons `a `3)",
  // "(define shit (quote + 1 1))",
  // "(eval shit)",
  // "{你好 [a] haha hello world!}",
  // '(define m "hello, world")',
  // '"hello, world"',
  // '(+ "hello " "world")',
  // '(display (+ "hello" " world!"))',
  // "(display (+ 1 1))",
  // "(display {你好})",
  // '(define a "s")',
  // "(define lst (list 1 a (+ 2 3) (lambda (x) (+ x 2))))",
  // "(get 1 lst)",
  // "(set 1 2 lst)",
  // "(push 100 lst)",
  // "lst",
  // '(define d (dict "a" 1 "b" 2 "c" 3 "def" "def" "0" (+ 1 2)))',
  // '(get "a" d)',
  // '(set "a" 100 d)',
  // "d",
  // '(llm "gpt4")',
];

const results: any[] = [];

for (const expr of exprs) {
  results.push(evalExpression(expr).value);
  console.log(results[results.length - 1]);
}
