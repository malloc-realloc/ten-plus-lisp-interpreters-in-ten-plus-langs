#include "builtins.h"

Obj runExpr(Env &env, vector<string> tokens, size_t &start) {
  if (tokens.size() == 0)
    return ErrorObj;
  if (start >= tokens.size())
    return ErrorObj;

  auto s = tokens[start];

  if (s == "(") {
    start++; // skip "("
    Obj v = runExpr(env, tokens, start);
    start++; // skip ")"
    return v;
  } else if (s == "+" || s == "-" || s == "*" || s == "/") {
    double v = 0;
    bool firstValue = true;
    start++;

    while (tokens[start] != ")") {
      Obj next = runExpr(env, tokens, start);
      double value = 0.0;

      if (next.type == ObjType::Double) {
        value = std::any_cast<double>(next.value);

        if (firstValue) {
          v = value;
          firstValue = false;
        } else {
          if (s == "+")
            v += value;
          else if (s == "-")
            v -= value;
          else if (s == "*")
            v *= value;
          else if (s == "/") {
            if (value == 0)
              throw std::runtime_error("Division by zero");
            v /= value;
          }
        }
      }
    }
    return Obj(ObjType::Double, v);
  } else if (s == "define") {
    string name = tokens[++start];
    start++;
    Obj value = runExpr(env, tokens, start);
    auto tmp = env.newVar(name, std::move(value));
    return *tmp;
  } else {
    if ('0' <= s[0] && s[0] <= '9') {
      start++;
      return Obj(ObjType::Double, std::strtod(s.c_str(), nullptr));
    } else {
      auto obj = env.get(s);
      if (!obj)
        throw runtime_error(s + "is not declared.");
      start++;
      auto res = *obj;
      return res;
    }
  }

  return Obj(ObjType::Error, 0);
}
