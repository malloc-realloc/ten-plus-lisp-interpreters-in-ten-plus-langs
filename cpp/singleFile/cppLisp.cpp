#include <algorithm>
#include <cctype>
#include <iostream>
#include <memory>
#include <unordered_map>
#include <vector>

using namespace std;
vector<char> keywords{'\"', ')', '('};
unordered_map<string, function<double(double, double)>> addSubMulDiv = {
    {"+", plus<double>()},
    {"-", minus<double>()},
    {"*", multiplies<double>()},
    {"/", divides<double>()}};

class ObjBase {
public:
  virtual ~ObjBase() {} // Virtual destructor
};

template <typename T> class Obj : public ObjBase {
public:
  T value;
  Obj(T v) : value(v) {}
};

struct Env {
  unordered_map<string, ObjBase> value;
  Env *father;
  bool end;
  Env(Env *father) : father(father), end(false), value({}) {}

  bool inEnv(const string &tok) {
    if (value.find(tok) != value.end()) {
      return true;
    }
    return (father != nullptr) && father->inEnv(tok);
  }

  ObjBase *get(const string &tok) {
    auto it = value.find(tok);
    if (it != value.end())
      return &(it->second);
    return father ? father->get(tok) : nullptr;
  }

  void set(const string &tok, ObjBase obj) { value[tok] = obj; }
};

string getNextWord(size_t &i, const string expr) {
  while (i < expr.size() && isspace(expr[i]))
    i++;
  if (i < expr.size() &&
      find(keywords.begin(), keywords.end(), expr[i]) != keywords.end()) {
    string result(1, expr[i++]);
    return result;
  }
  string s = "";
  while (i < expr.size() && !isspace(expr[i]) &&
         !(expr[i] == '(' || expr[i] == ')')) {
    s += (expr[i++]);
  }
  return s;
}

string getNextWordWithOutChangingIndex(size_t i, const string expr) {
  while (i < expr.size() && isspace(expr[i]))
    i++;
  if (i < expr.size() &&
      find(keywords.begin(), keywords.end(), expr[i]) != keywords.end()) {
    string result(1, expr[i++]);
    return result;
  }
  string s = "";
  while (i < expr.size() && !isspace(expr[i]) &&
         !(expr[i] == '(' || expr[i] == ')')) {
    s += (expr[i++]);
  }
  return s;
}

string skipExpr(size_t &i, const string expr) {
  string tok = getNextWord(i, expr);
  if (tok != "(") {
    return tok;
  } else {
    size_t l_minus_r = 1;
    while (l_minus_r != 0) {
      tok = getNextWord(i, expr);
      if (tok == "(")
        l_minus_r += 1;
      else if (tok == ")")
        l_minus_r -= 1;
    }
    return tok;
  }
}

double evalExpr(Env *env, size_t &i, const string expr) {
  string tok = getNextWord(i, expr);
  // cout << tok << endl;
  if (tok == "(") {
    double out = evalExpr(env, i, expr);
    getNextWord(i, expr);
    return out;
  } else if (!tok.empty() && all_of(tok.begin(), tok.end(), ::isdigit)) {
    return (stod(tok));
  } else if (addSubMulDiv.find(tok) != addSubMulDiv.end()) {
    auto opt = addSubMulDiv[tok];
    vector<double> numberObjs{};
    while (true) {
      auto out = evalExpr(env, i, expr);
      numberObjs.push_back((out));
      tok = getNextWordWithOutChangingIndex(i, expr);
      // cout << tok << endl;
      if (tok == ")")
        break; // Break the loop if we reach closing parenthesis
    }
    double outNumber = numberObjs[0];
    // cout << numberObjs[0]->value;
    for (size_t j = 1; j < numberObjs.size(); j++) {
      outNumber = opt(outNumber, numberObjs[j]);
    }
    return (outNumber);
  }

  return 0;
}

void repl(Env *env) {
  while (1) {
    string expr = "( + 3 5 )";
    vector<double> vec = {};
    cout << ">> ";
    // std::getline(std::cin, expr); // Read the entire line
    size_t i = 0;
    while (i < expr.size()) {
      vec.push_back(evalExpr(env, i, expr));
    }
    for (auto elem : vec) {
      cout << elem << endl;
    }
    break;
  }
}

int main() {
  Env env{nullptr};
  repl(&env);
}
