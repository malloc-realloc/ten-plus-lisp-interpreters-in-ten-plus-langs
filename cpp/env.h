#ifndef ENV_H
#define ENV_H

#include "commons.h"
#include "obj.h"

class Env : public std::map<std::string, Obj> {
public:
  int functionDepth = 0;
  bool hasFailed = false;
  std::string errorMessage = "";
  std::vector<std::string> thisStack;
  std::vector<Obj> thisValueStack = {
      None_Obj}; // always initialized with None_Obj
  std::map<std::string, std::map<std::string, Obj>> classes;
  Env *fatherEnv = nullptr;

  Env(int functionDepth = 0) : functionDepth(functionDepth) {}

  void cleanup() {
    functionDepth = 0;
    hasFailed = false;
    errorMessage = "";
    thisStack.clear();
    thisValueStack = {None_Obj};
  }

  void newThis(const std::string &s, const Obj &obj) {
    thisStack.push_back(s);
    (*this)["this"] = obj;
    thisValueStack.push_back(obj);
  }

  void popThis() {
    thisStack.pop_back();
    thisValueStack.pop_back();
    (*this)["this"] = thisValueStack.back();
  }

  std::string getThis() const {
    if (!thisStack.empty()) {
      return thisStack.back();
    }
    return "";
  }

  void set(const std::string &key, const Obj &value) {
    // Ensure value is of type Obj
    std::map<std::string, Obj>::operator[](key) = value;
  }

  void setErrorMessage(const std::string &message) {
    hasFailed = true;
    errorMessage = "Invalid invocation: " + message + ".\n";
  }

  Obj get(const std::string &key) const {
    auto it = this->find(key);
    if (it != this->end()) {
      return it->second;
    } else {
      return None_Obj;
    }
  }
};

#endif
