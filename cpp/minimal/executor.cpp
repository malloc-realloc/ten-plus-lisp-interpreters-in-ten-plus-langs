#include "builtins.h"

unique_ptr<Obj> runExpr(Env &env, vector<string> tokens, size_t &start) {
  if (tokens.size() == 0)
    return make_unique<Obj>(ErrorObj);
  if (start >= tokens.size())
    return make_unique<Obj>(ErrorObj);

  auto s = tokens[start];

  if (s == "(") {
    start++; // skip "("
    unique_ptr<Obj> v = runExpr(env, tokens, start);
    start++; // skip ")"
    return v;
  } else if (s == "+" || s == "-" || s == "*" || s == "/") {
    double v = 0;
    bool firstValue = true;
    start++;

    while (tokens[start] != ")") {
      unique_ptr<Obj> next = runExpr(env, tokens, start);
      double value = 0.0;

      if ((*next.get()).type == ObjType::Double) {
        value = std::any_cast<double>((*next.get()).value);

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
    return make_unique<Obj>(ObjType::Double, v);
  } else if (s == "define") {
    string name = tokens[++start];
    start++;
    unique_ptr<Obj> value = runExpr(env, tokens, start);
    return env.newVar(name, std::move(*value.get()));
  } else {
    if ('0' <= s[0] && s[0] <= '9') {
      start++;
      return make_unique<Obj>(ObjType::Double, std::strtod(s.c_str(), nullptr));
    } else {
      auto obj = env.get(s);
      if (!obj)
        throw runtime_error(s + "is not declared.");
      start++;
      auto res = *obj;
      return make_unique<Obj>(res);
    }
  }

  return make_unique<Obj>(ObjType::Error, 0);
}
