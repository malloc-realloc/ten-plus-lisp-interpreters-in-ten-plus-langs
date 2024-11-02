// #include <algorithm>
// #include <cctype>
// #include <iostream>
// #include <memory>
// #include <unordered_map>
// #include <vector>

// using namespace std;
// vector<char> keywords{'\"', ')', '('};
// unordered_map<string, function<double(double, double)>> addSubMulDiv = {
//     {"+", plus<double>()},
//     {"-", minus<double>()},
//     {"*", multiplies<double>()},
//     {"/", divides<double>()}};

// class ObjBase {
// public:
//   virtual ~ObjBase() {} // Virtual destructor
// };

// template <typename T> class Obj : public ObjBase {
// public:
//   T value;
//   Obj(T v) : value(v) {}
// };

// struct Env {
//   unordered_map<string, ObjBase> value;
//   Env *father;
//   bool end;
//   Env(Env *father) : father(father), end(false), value({}) {}

//   bool inEnv(const string &tok) {
//     if (value.find(tok) != value.end()) {
//       return true;
//     }
//     return (father != nullptr) && father->inEnv(tok);
//   }

//   ObjBase *get(const string &tok) {
//     auto it = value.find(tok);
//     if (it != value.end())
//       return &(it->second);
//     return father ? father->get(tok) : nullptr;
//   }

//   void set(const string &tok, ObjBase obj) { value[tok] = obj; }
// };

// string getNextWord(size_t &i, const string expr) {
//   while (i < expr.size() && isspace(expr[i]))
//     i++;
//   if (i < expr.size() &&
//       find(keywords.begin(), keywords.end(), expr[i]) != keywords.end()) {
//     string result(1, expr[i++]);
//     return result;
//   }
//   string s = "";
//   while (i < expr.size() && !isspace(expr[i]) &&
//          !(expr[i] == '(' || expr[i] == ')')) {
//     string result(1, expr[i++]);
//     s += result;
//   }
//   return s;
// }

// string skipExpr(size_t &i, const string expr) {
//   string tok = getNextWord(i, expr);
//   if (tok != "(") {
//     return tok;
//   } else {
//     size_t l_minus_r = 1;
//     while (l_minus_r != 0) {
//       tok = getNextWord(i, expr);
//       if (tok == "(")
//         l_minus_r += 1;
//       else if (tok == ")")
//         l_minus_r -= 1;
//     }
//     return tok;
//   }
// }

// unique_ptr<ObjBase> evalExpr(Env *env, size_t &i, const string expr) {
//   string tok = getNextWord(i, expr);
//   if (tok == "(") {
//     auto out = evalExpr(env, i, expr);
//     getNextWord(i, expr); // skip ")"
//     return out;
//   } else if (all_of(expr.begin(), expr.end(), ::isdigit)
//              // expr[0] >= '0' && expr[0] <= '9'
//   ) {
//     cout << stod(expr);
//     return make_unique<ObjBase>(Obj<double>(stod(expr)));
//   } else if (addSubMulDiv.find(tok) != addSubMulDiv.end()) {
//     function<double(double, double)> opt = addSubMulDiv[tok];
//     vector<Obj<double> *> numberObjs{};
//     while (tok != ")") {
//       auto out = evalExpr(env, i, expr);
//       if (auto derivedPtr = dynamic_cast<Obj<double> *>(out.get())) {
//         numberObjs.push_back(derivedPtr);
//       } else {
//         std::cerr << "Error: Conversion to Obj<double> failed." << std::endl;
//       }
//       tok = getNextWordWithOutChangingIndex(i, expr);
//     }
//     double outNumber = numberObjs[0]->value;
//     for (size_t j = 1; j < numberObjs.size(); j++)
//       outNumber = opt(outNumber, numberObjs[j]->value);
//     return make_unique<ObjBase>(Obj<double>(outNumber));
//   }
//   return nullptr;
// }

// void repl(Env *env) {
//   while (1) {
//     string expr = "";
//     cout << ">> ";
//     cin >> expr;
//     size_t i = 0;
//     while (i < expr.size()) {
//       auto u_ptr = evalExpr(env, i, expr);
//       auto out = dynamic_cast<Obj<double> *>(u_ptr.get());
//       cout << out->value << endl;
//     }
//   }
// }

// int main() {
//   Env env{nullptr};
//   repl(&env);
// }

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
  virtual ~ObjBase() {} // Make the class polymorphic
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
    s += expr[i++];
  }
  return s;
}

string getNextWordWithOutChangingIndex(size_t i, const string expr) {
  while (i < expr.size() && isspace(expr[i]))
    i++;
  if (i < expr.size() &&
      find(keywords.begin(), keywords.end(), expr[i]) != keywords.end()) {
    string result(1, (expr[i++]));
    return result;
  }
  string s = "";
  while (i < expr.size() && !isspace(expr[i]) &&
         !(expr[i] == '(' || expr[i] == ')')) {
    string result(1, expr[i++]);
    s += result;
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

// unique_ptr<ObjBase> evalExpr(Env *env, size_t &i, const string expr) {
//   string tok = getNextWord(i, expr);
//   if (tok == "(") {
//     auto out = evalExpr(env, i, expr);
//     getNextWord(i, expr); // skip ")"
//     return out;
//   } else if (all_of(tok.begin(), tok.end(), ::isdigit)) {
//     return make_unique<Obj<double>>(stod(tok));
//   } else if (addSubMulDiv.find(tok) != addSubMulDiv.end()) {
//     function<double(double, double)> opt = addSubMulDiv[tok];
//     vector<Obj<double> *> numberObjs{};
//     while (tok != ")") {
//       auto out = evalExpr(env, i, expr);
//       auto derivedPtr = dynamic_cast<Obj<double> *>(out.get());
//       if (derivedPtr) {
//         numberObjs.push_back(derivedPtr);
//       } else {
//         std::cerr << "Error: Conversion to Obj<double> failed." << std::endl;
//       }
//       tok = getNextWord(i, expr);
//     }
//     double outNumber = numberObjs[0]->value;
//     for (size_t j = 1; j < numberObjs.size(); j++)
//       outNumber = opt(outNumber, numberObjs[j]->value);
//     cout << outNumber;
//     return make_unique<Obj<double>>(outNumber);
//   }
//   return nullptr; // Handle cases where nothing is matched
// }

unique_ptr<ObjBase> evalExpr(Env *env, size_t &i, const string expr) {
  string tok = getNextWord(i, expr);
  if (tok == "(") {
    auto out = evalExpr(env, i, expr);
    getNextWord(i, expr); // skip ")"
    return out;
  } else if (!tok.empty() && all_of(tok.begin(), tok.end(), ::isdigit)) {
    // Ensure tok is not empty and consists of digits only
    return make_unique<Obj<double>>(stod(tok));
  } else if (addSubMulDiv.find(tok) != addSubMulDiv.end()) {
    function<double(double, double)> opt = addSubMulDiv[tok];
    vector<Obj<double> *> numberObjs{};
    while (true) {
      auto out = evalExpr(env, i, expr);
      if (!out) {
        std::cerr << "Error: Evaluation returned nullptr." << std::endl;
        break; // Exit the loop on error
      }
      auto derivedPtr = dynamic_cast<Obj<double> *>(out.get());
      if (derivedPtr) {
        numberObjs.push_back(derivedPtr);
      } else {
        std::cerr << "Error: Conversion to Obj<double> failed." << std::endl;
      }
      tok = getNextWordWithOutChangingIndex(i, expr);
      if (tok == ")")
        break; // Break the loop if we reach closing parenthesis
    }
    if (numberObjs.empty()) {
      std::cerr << "Error: No valid numbers found for operation." << std::endl;
      return nullptr;
    }
    double outNumber = numberObjs[0]->value;
    cout << numberObjs[0]->value;
    for (size_t j = 1; j < numberObjs.size(); j++) {
      cout << numberObjs[j]->value;
      outNumber = opt(outNumber, numberObjs[j]->value);
    }
    return make_unique<Obj<double>>(outNumber);
  }
  std::cerr << "Error: Unexpected token: " << tok << std::endl;
  return nullptr; // Handle cases where nothing is matched
}

void repl(Env *env) {
  while (1) {
    string expr = "";
    cout << ">> ";
    std::getline(std::cin, expr); // Read the entire line
    size_t i = 0;
    while (i < expr.size()) {
      auto u_ptr = evalExpr(env, i, expr);
      if (u_ptr) {
        auto out = dynamic_cast<Obj<double> *>(u_ptr.get());
        if (out) {
          cout << out->value << endl;
        } else {
          std::cerr << "Error: Evaluation did not yield a valid double."
                    << std::endl;
        }
      } else {
        std::cerr << "Error: Expression evaluation returned nullptr."
                  << std::endl;
      }
    }
  }
}

int main() {
  Env env{nullptr};
  repl(&env);
}
