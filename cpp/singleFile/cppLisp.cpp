#include <algorithm>
#include <cctype>
#include <iostream>
#include <memory>
#include <unordered_map>
#include <vector>

using namespace std;
vector<char> keywords{'\"', ')', '('};

class ObjBase {};
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

string getNextWord(size_t &i, string expr) {
  while (i < expr.size() && isspace(expr[i]))
    i++;
  if (i < expr.size() &&
      find(keywords.begin(), keywords.end(), expr[i]) != keywords.end())
    return "" + (expr[i++]);
  string s = "";
  while (i < expr.size() && !isspace(expr[i]) &&
         !(expr[i] == '(' || expr[i] == ')'))
    s += ("" + expr[i++]);
  return s;
}