#include "builtins.h"

auto const ErrorObj = make_shared<Obj>(ObjType::Error, "");

void skipExpr(vector<string> tokens, size_t &start) {
  if (tokens[start] != "(") {
    start++;
    return;
  } else {
    start++;
    size_t lBraceRBraceNumberGap = 1;
    while (lBraceRBraceNumberGap != 0 && start < tokens.size()) {
      if (tokens[start] == "(")
        lBraceRBraceNumberGap++;
      else if (tokens[start] == ")")
        lBraceRBraceNumberGap--;

      start++;
    }
  }
  return;
}

shared_ptr<Obj> runExpr(Env &env, vector<string> tokens, size_t &start) {
  if (tokens.size() == 0)
    return ErrorObj;
  if (start >= tokens.size())
    return ErrorObj;

  auto s = tokens[start];

  if (s == "(") {
    start++; // skip "("
    auto v = runExpr(env, tokens, start);
    start++; // skip ")"
    return v;
  } else if (s == "+" || s == "-" || s == "*" || s == "/") {
    double v = 0;
    bool firstValue = true;
    start++;

    while (tokens[start] != ")") {
      auto next = runExpr(env, tokens, start);
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
    return make_shared<Obj>(ObjType::Double, v);
  } else if (s == "define") {
    string name = tokens[++start];
    start++;
    auto value = runExpr(env, tokens, start);
    return env.newVar(name, value);
  } else if (s == "if") {
    start++;
    auto condObj = runExpr(env, tokens, start);
    auto v = std::any_cast<double>(condObj.get()->value);
    if (v) {
      auto out = runExpr(env, tokens, start);
      if (tokens[start] == ")")
        return out;
      else {
        // todo: skip without execution
        // runExpr(env, tokens, start);
        skipExpr(tokens, start);
        return out;
      }
    } else {
      // todo: skip without execution
      // runExpr(env, tokens, start);
      skipExpr(tokens, start);
      return runExpr(env, tokens, start);
    }
  } else {
    if ('0' <= s[0] && s[0] <= '9') {
      start++;
      return make_shared<Obj>(ObjType::Double, std::strtod(s.c_str(), nullptr));
    } else {
      auto obj = env.get(s);
      if (!obj)
        throw runtime_error(s + "is not declared.");
      start++;
      return obj;
    }
  }

  return ErrorObj;
}
