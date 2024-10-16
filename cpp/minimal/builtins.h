#ifndef BUILTIN_H
#define BUILTIN_H
#include "common.h"

enum class ObjType {
  Error,
  Double,
};

struct Obj {
  ObjType type;
  any value;
  Obj(ObjType type, any value) : type(type), value(value) {}
};

class Env {
private:
  unordered_map<string, shared_ptr<Obj>> map;

public:
  Env() {}

  std::shared_ptr<Obj> newVar(string name, shared_ptr<Obj> value) {
    map.insert_or_assign(name, value);
    return value;
  }

  std::shared_ptr<Obj> get(const std::string &name) {
    auto it = map.find(name);
    if (it != map.end()) {
      return it->second;
    } else {
      return nullptr;
    }
  }
};

vector<string> scan(string s);
shared_ptr<Obj> runExpr(Env &env, vector<string> tokens, size_t &start);
void skipExpr(vector<string> tokens, size_t &start);
int repl(Env &env);

#endif