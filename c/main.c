#include "ast.h"

int main() {
  char *input = "(+ 1 1)";

  Expr expr = parseExpr(input);
  printExpr(expr);
}