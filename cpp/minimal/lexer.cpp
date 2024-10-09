#include "builtins.h"

vector<string> scan(string expr) {
  vector<string> tokens{};
  for (size_t i = 0; i < expr.length(); ++i) {
    auto c = expr[i];
    string s = "";
    if (isspace(c))
      continue;
    else if (c == '(' || c == ')') {
      s += c;
      tokens.push_back(s);
      continue;
    } else {
      while (i < expr.length() && !isspace(expr[i]) && expr[i] != ')') {
        s += expr[i];
        i++;
      }
      i--;
      tokens.push_back(s);
    }
  }
  return tokens;
}