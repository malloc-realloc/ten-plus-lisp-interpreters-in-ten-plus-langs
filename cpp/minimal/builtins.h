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
const Obj ErrorObj{ObjType::Error, ""};

class Env {
private:
  unordered_map<string, Obj> map;

public:
  Env() {}

  Obj *newVar(string name, Obj &&obj) {
    auto [it, inserted] = map.insert_or_assign(name, std::move(obj));
    return &(it->second);
  }
  optional<Obj> get(const std::string &name) {
    auto it = map.find(name);
    if (it != map.end()) {
      return (it->second);
    } else {
      return nullopt;
    }
  }
};

vector<string> scan(string s);
Obj runExpr(Env &env, vector<string> tokens, size_t &start);
int repl(Env &env);

#endif