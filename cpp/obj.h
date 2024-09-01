#ifndef OBJ_H
#define OBJ_H

#include "ast.h"
#include "commons.h"

enum class ObjType { LIST_OBJ, DICT_OBJ, INT_OBJ, FLOAT_OBJ };

class Obj {
public:
  std::any value;
  Obj(const std::any &val) : value(val) {}
  virtual ~Obj() = default;
  Obj() : value(nullptr) {}

  virtual std::string toString() const {
    return std::string(std::any_cast<const char *>(value));
  }
};

class ErrorObj : public Obj {
public:
  ErrorObj(const std::string &val) : Obj(val) {}
};

auto const InnerErrorObj = ErrorObj("");

using Number = any;

class IntNumber : public Obj {
public:
  ObjType type;
  IntNumber(int val) : Obj(val), type(ObjType::INT_OBJ) {}
};

class FloatNumber : public Obj {
public:
  ObjType type;
  FloatNumber(double val) : Obj(val), type(ObjType::FLOAT_OBJ) {}
};

class Procedure : public Obj {
public:
  using Obj::Obj;
};

class Lambda_Procedure : public Obj {
public:
  std::any body;
  std::vector<Expr> argNames;
  std::string info;

  Lambda_Procedure(const std::string &value = "LambdaObj",
                   const Atom &info = Atom(),
                   const std::vector<Expr> &argNames = {},
                   const std::any &body = std::any())
      : Obj(value), body(body), argNames(argNames), info(info) {}

  std::string toString() const override {
    return std::any_cast<std::string>(value) + ", " + info;
  }
};

class Bool : public Obj {
public:
  Bool(bool val) : Obj(val) {}
};

class List_Obj : public Obj {
public:
  ObjType type;

  List_Obj(const std::vector<Obj> &val, ObjType type = ObjType::LIST_OBJ)
      : Obj(val), type(type) {}
};

class Dict_Obj : public Obj {
public:
  ObjType type;

  Dict_Obj(const std::map<std::string, Obj> &val,
           ObjType type = ObjType::DICT_OBJ)
      : Obj(val), type(type) {}
};

// 假设 TRUE, FALSE, None_Obj 的定义可以用如下值替代
extern const Bool TRUE(true);
extern const Bool FALSE(false);
extern const Obj None_Obj(nullptr);

class ExprObj : public Obj {
public:
  ExprObj(const Expr &val) : Obj(val) {}
};

class String_Obj : public Obj {
public:
  String_Obj(const std::string &val) : Obj(val) {}
};

class Class_Obj : public Obj {
public:
  Class_Obj(const std::string &val) : Obj(val) {}
};

class Instance_Obj : public Obj {
public:
  std::string instanceName;
  std::string className;

  Instance_Obj(const std::map<std::string, Obj> &val,
               const std::string &instanceName, const std::string &className)
      : Obj(val), instanceName(instanceName), className(className) {}
};

class Undefined_Obj : public Obj {
public:
  Undefined_Obj(const std::string &val) : Obj(val) {}
};

using MultiDimArray = std::any;

class ArrayObj : public Obj {
public:
  ArrayObj(const MultiDimArray &array) : Obj(array) {}
};

MultiDimArray createMultiDimArray(const std::vector<int> &dimensions,
                                  const Obj &initialValue = None_Obj) {
  if (dimensions.empty()) {
    return initialValue;
  }

  std::vector<MultiDimArray> result;
  result.reserve(dimensions[0]);
  for (int i = 0; i < dimensions[0]; ++i) {
    result.push_back(createMultiDimArray(
        std::vector<int>(dimensions.begin() + 1, dimensions.end()),
        initialValue));
  }
  return result;
}

#endif
