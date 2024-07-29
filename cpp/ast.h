// LispExpr.h
#ifndef AST_H
#define AST_H

#include <memory>
#include <sstream>
#include <string>
#include <variant>
#include <vector>

enum class LispExprType { ATOM, LST_EXPR, LLM_EXPR, STRING_EXPR, UNDEFINED };

using Atom = std::string;

class LispExpr;
using Literal =
    std::variant<Atom,
                 std::vector<std::variant<Atom, std::shared_ptr<LispExpr>>>>;

class LispExpr {
public:
  LispExprType type;
  Literal literal;

  LispExpr(LispExprType t, const Literal &l) : type(t), literal(l) {}
  LispExpr() : type(LispExprType::UNDEFINED), literal(Atom("")) {}

  std::string toString() const {
    std::ostringstream oss;
    oss << "{\n  \"Type\": \"" << exprTypeToString(type)
        << "\",\n  \"Literal\": ";
    std::visit(
        [&](const auto &l) {
          if constexpr (std::is_same_v<std::decay_t<decltype(l)>, Atom>) {
            oss << "\"" << l << "\"";
          } else {
            oss << "[\n  ";
            bool first = true;
            for (const auto &item : l) {
              if (!first)
                oss << ",\n  ";
              std::visit(
                  [&](const auto &i) {
                    if constexpr (std::is_same_v<std::decay_t<decltype(i)>,
                                                 Atom>) {
                      oss << "\"" << i << "\"";
                    } else {
                      oss << i->toString();
                    }
                  },
                  item);
              first = false;
            }
            oss << "\n  ]";
          }
        },
        literal);
    oss << "\n}";
    return oss.str();
  }

private:
  static std::string exprTypeToString(LispExprType t) {
    switch (t) {
    case LispExprType::ATOM:
      return "ATOM";
    case LispExprType::LST_EXPR:
      return "LST_EXPR";
    case LispExprType::LLM_EXPR:
      return "LLM_EXPR";
    case LispExprType::STRING_EXPR:
      return "STRING_EXPR";
    case LispExprType::UNDEFINED:
      return "UNDEFINED";
    default:
      return "UNKNOWN";
    }
  }
};

Literal convertToLiteral(const std::vector<std::shared_ptr<LispExpr>> &vec) {
  std::vector<std::variant<Atom, std::shared_ptr<LispExpr>>> convertedVec;

  // Convert each element in the original vector to the required variant type
  for (const auto &elem : vec) {
    convertedVec.push_back(elem);
  }

  // Now convertedVec is of the type that can be stored in Literal
  return convertedVec;
}

#endif