#include <algorithm>
#include <cctype>
#include <iostream>
#include <memory>
#include <string>
#include <string_view>
#include <unordered_map>
#include <vector>

using namespace std;

class Obj;
class Env;
using ObjPtr = unique_ptr<Obj>;
ObjPtr evalExprs(Env &, size_t &, string_view expr, size_t end);

static const unordered_map<string_view, function<double(double, double)>>
    operators = {{"+", plus<double>()},
                 {"-", minus<double>()},
                 {"*", multiplies<double>()},
                 {"/", divides<double>()},
                 {"==", [](double x, double y) { return x == y ? 1.0 : 0.0; }},
                 {"!=", [](double x, double y) { return x != y ? 1.0 : 0.0; }}};


static const vector<char> keywords{'\"', ')', '('};

class Obj {
public:
  virtual ~Obj() = default;
  virtual string toString() const = 0;
  virtual unique_ptr<Obj> clone() const = 0;
};

class NumberObj : public Obj {
public:
  double value;
  explicit NumberObj(double v) : value(v) {}

  string toString() const override { return to_string(value); }

  unique_ptr<Obj> clone() const override {
    return make_unique<NumberObj>(value);
  }
};

class StringObj : public Obj {
public:
  string_view value; // Changed to string_view
  explicit StringObj(string_view v) : value(v) {}

  string toString() const override { return "\"" + string(value) + "\""; }

  unique_ptr<Obj> clone() const override {
    return make_unique<StringObj>(value); // No need to copy, just pass the view
  }
};

class LambdaObj : public Obj {
public:
  vector<string_view> params; // Changed to string_view
  string_view body;           // Changed to string_view

  LambdaObj(const vector<string_view> &params, string_view body)
      : params(params), body(body) {}

  string toString() const override {
    string result = "(lambda (";
    for (size_t i = 0; i < params.size(); i++) {
      if (i > 0)
        result += " ";
      result += string(params[i]);
    }
    result += ") ";
    result += string(body);
    result += ")";
    return result;
  }

  unique_ptr<Obj> clone() const override {
    return make_unique<LambdaObj>(params, body); // No need to copy strings
  }
};

class VoidObj : public Obj {
public:
  VoidObj() = default;

  string toString() const override { return ""; }

  unique_ptr<Obj> clone() const override { return make_unique<VoidObj>(); }
};

class ListObj : public Obj {
public:
  vector<unique_ptr<Obj>> elements;

  ListObj() = default;

  explicit ListObj(vector<unique_ptr<Obj>> elems)
      : elements(std::move(elems)) {}

  string toString() const override {
    string result = "(";
    for (size_t i = 0; i < elements.size(); i++) {
      if (i > 0)
        result += " ";
      result += elements[i]->toString();
    }
    result += ")";
    return result;
  }

  unique_ptr<Obj> clone() const override {
    vector<unique_ptr<Obj>> newElements;
    for (const auto &elem : elements) {
      newElements.push_back(elem->clone());
    }
    return make_unique<ListObj>(std::move(newElements));
  }
};

class Env {
private:
  unordered_map<string_view, unique_ptr<Obj>> values; // Changed to string_view
  Env *parent;
  vector<string> storage; // Storage for string lifetime management

public:
  explicit Env(Env *p = nullptr) : parent(p) {}

  Env(const Env &) = delete;
  Env &operator=(const Env &) = delete;

  Env(Env &&) = default;
  Env &operator=(Env &&) = default;

  bool contains(string_view name) const {
    return values.count(name) > 0 || (parent && parent->contains(name));
  }

  bool containsLocal(string_view name) const { return values.count(name) > 0; }

  const Obj *get(string_view name) const {
    auto it = values.find(name);
    if (it != values.end()) {
      return it->second.get();
    }
    return parent ? parent->get(name) : nullptr;
  }

  void set(string_view name, unique_ptr<Obj> value) {
    storage.push_back(string(name));           // Store the string
    values[storage.back()] = std::move(value); // Use the stored string's view
  }

  unique_ptr<Obj> getClone(string_view name) const {
    const Obj *obj = get(name);
    return obj ? obj->clone() : nullptr;
  }

  bool setExisting(string_view name, unique_ptr<Obj> value) {
    if (values.count(name) > 0) {
      values[name] = std::move(value);
      return true;
    }
    return parent ? parent->setExisting(name, std::move(value)) : false;
  }

  Env *findDefiningScope(string_view name) {
    if (values.count(name) > 0) {
      return this;
    }
    return parent ? parent->findDefiningScope(name) : nullptr;
  }
};

string_view getNextToken(size_t &pos, const string_view expr) {
  while (pos < expr.size() && isspace(expr[pos])) {
    pos++;
  }

  if (pos >= expr.size()) {
    return "";
  }

  if (find(keywords.begin(), keywords.end(), expr[pos]) != keywords.end()) {
    return expr.substr(pos++, 1);
  }

  size_t start = pos;
  while (pos < expr.size() && !isspace(expr[pos]) && expr[pos] != '(' &&
         expr[pos] != ')') {
    pos++;
  }
  return expr.substr(start, pos - start);
}

void skipExpr(size_t &pos, const string_view expr) {
  while (pos < expr.size() && isspace(expr[pos])) {
    pos++;
  }

  if (pos >= expr.size()) {
    return;
  }

  if (expr[pos] == '(') {
    pos++;
    int bracketCount = 1;

    while (pos < expr.size() && bracketCount > 0) {
      if (expr[pos] == '(') {
        bracketCount++;
      } else if (expr[pos] == ')') {
        bracketCount--;
      }
      pos++;
    }

    if (bracketCount > 0) {
      throw runtime_error("Unmatched parentheses");
    }
  } else {
    getNextToken(pos, expr);
  }
}

ObjPtr evalExpr(Env &env, size_t &pos, const string_view expr) {
  string_view token = getNextToken(pos, expr);

  if (token.empty()) {
    return nullptr;
  }

  if (token == "(") {
    auto result = evalExpr(env, pos, expr);
    getNextToken(pos, expr);
    return result;
  }

  if (!token.empty() &&
      (isdigit(token[0]) || (token[0] == '-' && token.length() > 1))) {
    try {
      return make_unique<NumberObj>(stod(string(token)));
    } catch (...) {
      return nullptr;
    }
  }

  if (operators.count(token) > 0) {
    auto op = operators.at(token);
    vector<double> numbers;

    while (true) {
      auto nextObj = evalExpr(env, pos, expr);
      if (!nextObj)
        break;

      if (auto *numObj = dynamic_cast<NumberObj *>(nextObj.get())) {
        numbers.push_back(numObj->value);
      }

      string_view next = getNextToken(pos, expr);
      if (next == ")")
        break;
      pos -= next.length();
    }

    if (numbers.empty()) {
      return make_unique<NumberObj>(0);
    }

    double result = numbers[0];
    for (size_t i = 1; i < numbers.size(); i++) {
      result = op(result, numbers[i]);
    }
    return make_unique<NumberObj>(result);
  }

  if (token == "\"") {
    size_t start = pos;
    while (pos < expr.size() && expr[pos] != '\"') {
      pos++;
    }
    string_view str = expr.substr(start, pos - start);
    pos++;
    return make_unique<StringObj>(str);
  }

  if (token == "define") {
    string_view name = getNextToken(pos, expr);
    auto value = evalExpr(env, pos, expr);
    if (value) {
      env.set(name, value->clone());
      return value;
    }
    return nullptr;
  }

  if (token == "begin") {
    unique_ptr<Obj> lastResult;
    while (true) {
      auto result = evalExpr(env, pos, expr);
      if (!result)
        break;
      lastResult = std::move(result);

      string_view next = getNextToken(pos, expr);
      if (next == ")")
        break;
      pos -= next.length();
    }
    return lastResult ? std::move(lastResult) : make_unique<VoidObj>();
  }

  if (token == "display") {
    auto value = evalExpr(env, pos, expr);
    if (value) {
      if (auto *strObj = dynamic_cast<StringObj *>(value.get())) {
        cout << strObj->value << endl;
      } else {
        cout << value->toString() << endl;
      }
    }
    return make_unique<VoidObj>();
  }

  if (token == "if") {
    auto condition = evalExpr(env, pos, expr);
    if (!condition) {
      return nullptr;
    }

    bool isTrue = false;
    if (auto *numObj = dynamic_cast<NumberObj *>(condition.get())) {
      isTrue = numObj->value != 0;
    }

    if (!isTrue) {
      skipExpr(pos, expr);
      return make_unique<NumberObj>(0);
    } else {
      auto out = evalExpr(env, pos, expr);
      skipExpr(pos, expr);
      return out;
    }
  }

  if (token == "while") {
    auto conditionPosition = pos;
    auto condition = evalExpr(env, pos, expr);
    if (!condition) {
      return nullptr;
    }

    bool isTrue = false;
    if (auto *numObj = dynamic_cast<NumberObj *>(condition.get())) {
      isTrue = numObj->value != 0;
    }

    auto bodyPosition = pos;
    unique_ptr<Obj> lastResult;

    while (isTrue) {
      unique_ptr<Obj> bodyResult;
      while (pos < expr.size()) {
        auto result = evalExpr(env, pos, expr);
        if (!result) {
          return nullptr;
        }
        bodyResult = std::move(result);

        string_view next = getNextToken(pos, expr);
        if (next == ")") {
          break;
        }
        pos -= next.length();
      }
      lastResult = std::move(bodyResult);

      pos = conditionPosition;
      condition = evalExpr(env, pos, expr);
      if (!condition) {
        return nullptr;
      }

      if (auto *numObj = dynamic_cast<NumberObj *>(condition.get())) {
        isTrue = numObj->value != 0;
      } else {
        return nullptr;
      }

      if (isTrue) {
        pos = bodyPosition;
      }
    }

    if (!isTrue) {
      skipExpr(pos, expr);
    }

    return lastResult ? std::move(lastResult) : make_unique<NumberObj>(0);
  }

  if (token == "lambda") {
    token = getNextToken(pos, expr);
    if (token != "(") {
      return nullptr;
    }

    vector<string_view> params;
    while (true) {
      token = getNextToken(pos, expr);
      if (token == ")")
        break;
      if (token.empty())
        return nullptr;
      params.push_back(token);
    }

    size_t bodyStart = pos;
    int parenCount = 0;
    bool started = false;

    while (pos < expr.size()) {
      char c = expr[pos];
      if (c == '(') {
        started = true;
        parenCount++;
      } else if (c == ')') {
        parenCount--;
        if (started && parenCount == 0) {
          pos++;
          break;
        }
      }
      pos++;
    }

    string_view body = expr.substr(bodyStart, pos - bodyStart - 1);
    return make_unique<LambdaObj>(params, body);
  }

  if (env.contains(token)) {
    auto obj = env.getClone(token);
    if (auto *lambda = dynamic_cast<LambdaObj *>(obj.get())) {
      vector<unique_ptr<Obj>> args;
      for (size_t i = 0; i < lambda->params.size(); i++) {
        auto arg = evalExpr(env, pos, expr);
        if (!arg)
          return nullptr;
        args.push_back(std::move(arg));
      }

      Env newEnv(&env);
      for (size_t i = 0; i < lambda->params.size(); i++) {
        newEnv.set(lambda->params[i], args[i]->clone());
      }

      size_t bodyPos = 0;
      return evalExpr(newEnv, bodyPos, lambda->body);
    }
    return obj;
  }

  // 其他函数实现...（let, set!, eval, list, car, cdr, cons, len）
  // 使用相同的模式修改，主要是将string改为string_view
  if (token == "let") {
    Env newEnv(&env);

    string_view nextToken = getNextToken(pos, expr);
    if (nextToken != "(") {
      return nullptr;
    }

    while (true) {
      nextToken = getNextToken(pos, expr);
      if (nextToken == ")")
        break;

      string_view varName = nextToken;
      auto varValue = evalExpr(env, pos, expr);
      if (!varValue)
        return nullptr;

      newEnv.set(varName, varValue->clone());
    }

    return evalExpr(newEnv, pos, expr);
  }

  if (token == "set!") {
    string_view varName = getNextToken(pos, expr);
    auto newValue = evalExpr(env, pos, expr);
    if (!newValue)
      return nullptr;

    if (env.setExisting(varName, newValue->clone())) {
      return newValue;
    } else {
      throw runtime_error("Variable not found for set!");
    }
  }

  if (token == "eval") {
    auto exprObj = evalExpr(env, pos, expr);
    if (auto *strObj = dynamic_cast<StringObj *>(exprObj.get())) {
      size_t evalPos = 0;
      return evalExpr(env, evalPos, strObj->value);
    }
    throw runtime_error("eval expects a string argument");
  }

  if (token == "list") {
    vector<unique_ptr<Obj>> elements;
    while (true) {
      auto elem = evalExpr(env, pos, expr);
      if (!elem)
        break;
      elements.push_back(std::move(elem));

      string_view next = getNextToken(pos, expr);
      if (next == ")")
        break;
      pos -= next.length();
    }
    return make_unique<ListObj>(std::move(elements));
  }

  if (token == "car") {
    auto listObj = evalExpr(env, pos, expr);
    if (auto *list = dynamic_cast<ListObj *>(listObj.get())) {
      if (!list->elements.empty()) {
        return list->elements[0]->clone();
      }
    }
    throw runtime_error("car expects a non-empty list");
  }

  if (token == "cdr") {
    auto listObj = evalExpr(env, pos, expr);
    if (auto *list = dynamic_cast<ListObj *>(listObj.get())) {
      if (list->elements.size() > 1) {
        vector<unique_ptr<Obj>> tailElements;
        for (size_t i = 1; i < list->elements.size(); i++) {
          tailElements.push_back(list->elements[i]->clone());
        }
        return make_unique<ListObj>(std::move(tailElements));
      }
    }
    throw runtime_error("cdr expects a list with at least two elements");
  }

  if (token == "cons") {
    auto firstObj = evalExpr(env, pos, expr);
    auto listObj = evalExpr(env, pos, expr);

    if (auto *list = dynamic_cast<ListObj *>(listObj.get())) {
      vector<unique_ptr<Obj>> newElements;
      newElements.push_back(std::move(firstObj));
      for (auto &elem : list->elements) {
        newElements.push_back(elem->clone());
      }
      return make_unique<ListObj>(std::move(newElements));
    }
    throw runtime_error("cons expects a list as the second argument");
  }

  if (token == "len") {
    auto listObj = evalExpr(env, pos, expr);
    if (auto *list = dynamic_cast<ListObj *>(listObj.get())) {
      return make_unique<NumberObj>(list->elements.size());
    }
    throw runtime_error("len expects a list argument");
  }

  cout << "Invalid Input: " << token << endl;
  return nullptr;
}

ObjPtr evalExprs(Env &env, size_t &pos, const string_view expr, size_t end) {
  ObjPtr result = nullptr;
  while (pos < end) {
    result = evalExpr(env, pos, expr);
    if (result && !dynamic_cast<VoidObj *>(result.get())) {
      cout << result->toString() << endl;
    }
  }
  return result;
}

void repl() {
  Env globalEnv;
  vector<string> inputStorage; // 存储输入字符串

  while (true) {
    cout << ">> ";
    string expr;
    getline(cin, expr);

    if (expr == "exit")
      break;

    try {
      inputStorage.push_back(std::move(expr));    // 存储输入
      string_view exprView = inputStorage.back(); // 创建视图
      size_t pos = 0;
      evalExprs(globalEnv, pos, exprView, exprView.size());
    } catch (const exception &e) {
      cout << "Error: " << e.what() << endl;
    }
  }
}

int main() {
  repl();
  return 0;
}