import { parseExpr } from "./parser";
import { tokenize } from "./token";
import { Expr } from "./ast";

const exprs: string[] = [
  // "(define r 1)",
  // "(define fn (lambda (x) (define r 2) (+ x r)))",
  // "(fn 2)",
  // "(display r)",
  // "(define a 1)",
  // "{what is the number [a]}",
  // "(define fa (lambda (x) (+ x a)))",
  // "(define a 2)",
  // "(fa 2)",
  // "((lambda (x) (+ x 1)) 2)",
  // "(define f (lambda (x) (+ 2 x)))",
  // "(f 4)",
  // "(define higher_levelFunction (lambda (x) (lambda (y) (+  y x a))))",
  // "(define add2 (higher_levelFunction 2))",
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
  "{你好 [a] haha hello world!}",
  '(define m "hello, world")',
];

const expr_list: Expr[] = [];
exprs.forEach((expr) => {
  const token = tokenize(expr);
  console.log(tokenize(expr));

  const e = parseExpr(token);
  expr_list.push(e);
  console.log(e);
});
