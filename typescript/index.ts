// main.ts
import { tokenize } from "./token";
import { parseExpr } from "./parser";
import { evalExpr } from "./eval";
import { Env } from "./env";
import { ErrorObj, None_Obj, Obj } from "./obj";
import { ExprType } from "./ast";

const globalEnv = new Env();

function evalExpression(expr: string): Obj {
  const tokenizedExpr: string[] = tokenize(expr);
  if (tokenizedExpr.length === 0) {
    // all expressions are comment.
    return new ErrorObj("Lexer Error");
  }
  const ast = parseExpr(tokenizedExpr);
  if (ast.type === ExprType.ERROR) {
    return new ErrorObj("Parsing Error");
  } else {
    const result: Obj = evalExpr(globalEnv, ast);
    return result;
  }
}

const exprs: string[] = [
  // "(define r 1)",
  // "(define fn (lambda (x) (define r 2) (+ x r)))",
  // "(fn 2)",
  // "(display r)",
  // '(define a "haha")',
  // "{what is the number [a]}",
  // "(define a 2)",
  // "(define fa (lambda (x) (+ x a)))",
  // "(fa 2)",
  // "((lambda (x) (+ x 1)) 2)",
  // "(define f (lambda (x) (+ 2 x)))",
  // "(f 4)",
  // "(define higher_level_function (lambda (x) (lambda (y) (+  y x 2))))",
  // "(define add2 (higher_level_function 2))",
  // "(add2 4)",
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
  // "'haha'",
  // "(bind a (+ 1 1) (define b 2))",
  // "(update a 1)",
  // "(+ b 2)",
  // "(bind a (define c 2))",
  // "(update a 2)",
  // "(+ c 1)",
  // "\"The following expressions is OOP of this language: bind expressions to item of dict. lambda doesn't work because lambda is bound with local env. bind works because it's using global env\"",
  // "\"that might be the reason why react can be written by both binding expressions to obj and class\"",
  // '(define d (dict "f" 0 "b" 2))',
  // '(set "f" 0 d)',
  // '(bind (get "f" d) (set "b"  ( + (get "b" d) 1) d) )',
  // '(update (get "f" d) 0)',
  // '(display (get "b" d))',
  // '(update (get "f" d) 0)',
  // '(get "b" d)',
  // '(str "; " (+ 1 1) (lambda (x) (+ x 1)))',
  // "(define f (lambda (x) (if x (begin (display x) (f (- x 1)) ) 0)))",
  // "(f 2)",
  // "(if 0 1 2)",
  // "(define d 2)",
  // "(while d (display d) (update d (- d 1)))",
  // "(random 1 2)",
  // "(randint 1 3)",
  // '(randchoice 1 2 "haha")',
  // "(return 1)",
  // "(_displayFuncDepth)",
  // "(define f (lambda (x) (_displayFuncDepth) (return x) (display 2) ))",
  // "(f 4)",
  // "(define f (lambda (x) (if x (return x)) (+ x 1)))",
  // "(f 0)",
  // "(f 1)",
  "(+ 11 a b ",
  // "(if 1)",
];

const results: any[] = [];

for (const expr of exprs) {
  results.push(evalExpression(expr).value);
  console.log(results[results.length - 1]);
}
