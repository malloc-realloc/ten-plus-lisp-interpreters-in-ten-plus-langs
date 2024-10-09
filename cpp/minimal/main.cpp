#include "builtins.h"
#include "common.h"

int main() {
  Env env{};
  // vector<string> exprs = {"(+ 3 1)",};
  // for (auto expr : exprs) {
  //   auto tokens = scan(expr);
  //   size_t start = 0;
  //   Obj v = runExpr(env, tokens,start);
  //   cout <<  std::any_cast<double>(v.value) << endl;
  // }
  repl(env);
}