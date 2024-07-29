#include "ast.h"
#include "parser.h"
#include "token.h"
#include <iostream>

void TestToken(std::string expr);
void TestParser(std::string expr);

int main() {
  std::vector<std::string> exprs = {
      "(define r 1)",
      "(define fn (lambda (x) (define r 2) (+ x r)))",
      "(fn 2)",
      "(display r)",
      "(define a 1)",
      "{what is the number [a]}",
      "(define fa (lambda (x) (+ x a)))",
      "(define a 2)",
      "(fa 2)",
      "((lambda (x) (+ x 1)) 2)",
      "(define f (lambda (x) (+ 2 x)))",
      "(f 4)",
      "(define higher_level_function (lambda (x) (lambda (y) (+  y x a))))",
      "(define add2 (higher_level_function 2))",
      "(add2 4)",
      "(define r 2)",
      "(define with_r_2 (lambda (x) (+ r x)))",
      "(with_r_2 10)",
      "(define r 10)",
      "(with_r_2 10)",
      "(if (> -1 0) 2 1)",
      "(if 0 2 1)", // 0 is consider as TRUE
      "(define r 10)",
      "(set! r 2)",
      "(define e (quote + 1 2))",
      "(eval e)",
      "(define qe (quote 1))",
      "(eval qe)",
      "(eval (car `(1)))",
      "(eval (car `(1 1 1 )))",
      "(eval (cdr `(1 + 1 1)))",
      "(eval (car `((+ 1  1)) ))",
      "(cdr (quote 1 2 3))",
      "(cons `1 `(1 1))",
      "(cons (quote +) `(1 1 ))",
      "(cons `+ `(1 1))",
      "(define 世界 1)",
      "(display 世界)",
      "(define temp (cons `a `(1 1)))",
      "(cons `(a b) `(b c d))", // "(cons `(a b) `(b c d))" is wrong
      "(cons `(a b) `c)",
      "(cons `a `3)",
      "(define shit (quote + 1 1))",
      "(eval shit)",
      "{你好 [a] haha hello world!}",
      "(define m \"hello, world\")",
      "\"hello, world\"",
  };

  for (const auto &expr : exprs) {
    // TestToken(expr);
    TestParser(Atom(expr));
  }

  return 0;
}

void TestToken(std::string expr) {
  auto tokens = tokenize(expr);
  std::cout << expr << " is " << std::endl;
  for (auto token : tokens) {
    std::cout << token << std::endl;
  }
}

void TestParser(Atom expr) {

  std::vector<std::string> tokens = tokenize(expr);

  std::cout << "Tokens: ";
  for (const auto &token : tokens) {
    std::cout << token << " ";
  }
  std::cout << std::endl;

  std::shared_ptr<LispExpr> e = parseLispExpr(tokens);

  std::cout << "Parsed expression: " << e->toString() << std::endl;
}