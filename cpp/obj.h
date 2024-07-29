#ifndef OBJ_H
#define OBJ_H

#include "ast.h"
#include <memory>
#include <regex>
#include <string>
#include <variant>
#include <vector>

enum class ObjType {
  INT,
  FLOAT,
  PROCEDURE,
  BOOL,
  NONE,
  ERROR,
  EXPR,
  LAMBDA_PROCEDURE,
  LLM_EXPR_OBJ
};

class Obj;
class IntNumber;
class FloatNumber;
class Procedure;
class Lambda_Procedure;
class Bool;
class Error;
class LispExprObj;
class LLM_EXPRObj;

using Number = std::variant<IntNumber, FloatNumber>;

class Obj {
public:
  std::variant<int, double, std::function<void()>, bool, std::nullptr_t,
               std::string, std::shared_ptr<LispExpr>>
      value;
  ObjType type;

  Obj(const auto &val, ObjType t) : value(val), type(t) {}

  std::string toString() const {
    std::ostringstream oss;
    oss << "Obj is ";

    std::visit(
        [&oss](auto &&arg) {
          using T = std::decay_t<decltype(arg)>;
          if constexpr (std::is_same_v<T, int> || std::is_same_v<T, double> ||
                        std::is_same_v<T, bool>) {
            oss << arg;
          } else if constexpr (std::is_same_v<T, std::string>) {
            oss << '"' << arg << '"';
          } else if constexpr (std::is_same_v<T, std::nullptr_t>) {
            oss << "nullptr";
          } else if constexpr (std::is_same_v<T, std::function<void()>>) {
            oss << "<function>";
          } else if constexpr (std::is_same_v<T, std::shared_ptr<LispExpr>>) {
            oss << "<expr>";
          } else {
            oss << "<unknown>";
          }
        },
        value);

    oss << ", type is " << static_cast<int>(type);
    return oss.str();
  }
};

class IntNumber : public Obj {
public:
  IntNumber(int val) : Obj(val, ObjType::INT) {}
};

class FloatNumber : public Obj {
public:
  FloatNumber(double val) : Obj(val, ObjType::FLOAT) {}
};

class Procedure : public Obj {
public:
  Atom name;

  Procedure(const std::function<void()> &val, const Atom &n = "lambda",
            ObjType t = ObjType::PROCEDURE)
      : Obj(val, t), name(n) {}
};

class Lambda_Procedure : public Procedure {
public:
  std::variant<std::vector<std::shared_ptr<LispExpr>>,
               std::shared_ptr<LispExpr>>
      body;
  std::vector<std::shared_ptr<LispExpr>> argNames;

  Lambda_Procedure(const std::function<void()> &val, const Atom &n = "lambda",
                   ObjType t = ObjType::LAMBDA_PROCEDURE,
                   const std::vector<std::shared_ptr<LispExpr>> &args = {},
                   const std::variant<std::vector<std::shared_ptr<LispExpr>>,
                                      std::shared_ptr<LispExpr>> &b = {})
      : Procedure(val, n, t), body(b), argNames(args) {}
};

class Bool : public Obj {
public:
  Bool(bool val) : Obj(val, ObjType::BOOL) {}
};

class Error : public Obj {
public:
  Error(const std::string &val = "") : Obj(val, ObjType::ERROR) {}
};

class LispExprObj : public Obj {
public:
  LispExprObj(const std::shared_ptr<LispExpr> &val) : Obj(val, ObjType::EXPR) {}
};

class LLM_EXPRObj : public Obj {
public:
  LLM_EXPRObj(const std::shared_ptr<LispExpr> &val)
      : Obj(val, ObjType::LLM_EXPR_OBJ) {}
};

const auto TRUE = std::make_shared<Bool>(true);
const auto FALSE = std::make_shared<Bool>(false);
const auto None_Obj = std::make_shared<Obj>(nullptr, ObjType::NONE);

#endif