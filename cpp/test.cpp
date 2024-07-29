#include "common.h"

void TestToken(std::string expr);
// void TestParser(std::string expr);

int main() {
  std::vector<std::string> exprs = {
      "{what is the number [a]}",
      "{你好 [a] haha hello world!}",
      "(define m \"hello, world\")",
      "\"hello, world\"",
  };

  for (const auto &expr : exprs) {
    TestToken(expr);
    // TestParser(expr);
  }

  auto expr = LispExpr(LispExprType::ATOM, "1");
  std::cout << expr.toString();

  return 0;
}

void TestToken(std::string expr) {
  auto tokens = tokenize(expr);
  std::cout << expr << " is " << std::endl;
  for (auto token : tokens) {
    std::cout << token << std::endl;
  }
}