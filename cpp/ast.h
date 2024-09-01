#ifndef AST_H
#define AST_H

#include "commons.h"

// Enum to represent different expression types
enum class ExprType {
  ATOM,
  LST_EXPR,
  STRING_EXPR,
  ERROR,
};

// Using std::any to represent AtomOrExprVec: Atom | Array<Atom | Expr>
using AtomOrExprVec = std::any;

// Expr class representing an expression
class Expr {
public:
  ExprType type;
  AtomOrExprVec value;

  Expr(ExprType type, AtomOrExprVec value) : type(type), value(value) {}

  std::string toString() const {
    if (type == ExprType::LST_EXPR) {
      std::string literalStr;
      try {
        const auto &literalVec =
            std::any_cast<const std::vector<Expr> &>(value);

        for (const auto &item : literalVec) {
          switch (item.type) {
          case ExprType::LST_EXPR:
            literalStr += item.toString();
            break;
          case ExprType::STRING_EXPR:
          case ExprType::ATOM: {
            literalStr += "\"" + std::any_cast<Atom>(item.value) + "\"";
          } break;
          default:
            throw std::runtime_error("Unknown ExprType");
          }
          literalStr += ",\n  ";
        }
      } catch (const std::bad_any_cast &e) {
        throw std::runtime_error("Invalid type in value: " +
                                 std::string(e.what()));
      }

      // Remove the last comma and newline
      if (!literalStr.empty()) {
        literalStr.erase(literalStr.length() - 4);
      }
      return "{\n  \"Type\": \"" + exprTypeToString(type) +
             "\",\n  \"AtomOrExprVec\": [\n  " + literalStr + "\n  ]\n}";
    } else if ((type == ExprType::ATOM) || (type == ExprType::STRING_EXPR)) {
      return "{\n  \"Type\": \"" + exprTypeToString(type) +
             "\",\n  \"AtomOrExprVec\": \"" +
             std::any_cast<const Atom &>(value) + "\"\n}";
    } else {
      return "{\n  \"Type\": \"" + exprTypeToString(type) +
             "\",\n  \"AtomOrExprVec\": \"Unknown\"\n}";
    }
  }

private:
  std::string exprTypeToString(ExprType type) const {
    switch (type) {
    case ExprType::ATOM:
      return "ATOM";
    case ExprType::LST_EXPR:
      return "LST_EXPR";
    case ExprType::STRING_EXPR:
      return "STRING_EXPR";
    case ExprType::ERROR:
      return "ERROR";
    default:
      return "UNKNOWN";
    }
  }
};

Expr parseExpr(std::vector<std::string> &tokens) {
  try {
    if (tokens.empty()) {
      throw std::runtime_error("Unexpected end of tokens");
    }

    std::string token = tokens.front();
    tokens.erase(tokens.begin()); // Remove the first token

    if (token == "\"") {
      if (tokens.empty()) {
        throw std::runtime_error("Unexpected end of tokens");
      }
      Expr expr = Expr(ExprType::STRING_EXPR, tokens.front());
      tokens.erase(tokens.begin()); // Remove the string value
      if (!tokens.empty()) {
        tokens.erase(tokens.begin()); // Remove the closing quote
      }
      return expr;
    }

    if (token == "(") {
      std::vector<Expr> lstExpr;
      while (!tokens.empty() && tokens.front() != ")") {
        lstExpr.push_back(parseExpr(tokens));
      }

      if (tokens.empty()) {
        throw std::runtime_error("Unexpected end of tokens");
      }
      tokens.erase(tokens.begin()); // Remove the closing ')'
      return Expr(ExprType::LST_EXPR, std::move(lstExpr));
    } else {
      return Expr(ExprType::ATOM, token);
    }
  } catch (const std::exception &e) {
    return Expr(ExprType::ERROR, "Parsing Error.");
  }
}

// int main() {
//   Atom atom1 = "example_atom";
//   Expr expr1(ExprType::ATOM, atom1);

//   std::vector<std::any> lstExpr = {atom1, expr1};
//   Expr expr2(ExprType::LST_EXPR, lstExpr);

//   std::vector<std::any> lstExpr3 = {expr2, atom1};
//   Expr expr3(ExprType::LST_EXPR, lstExpr3);

//   std::cout << expr1.toString() << std::endl;
//   std::cout << expr2.toString() << std::endl;
//   std::cout << expr3.toString() << std::endl;

//   std::vector<std::string> tokens = {"(", "hello", "world", ")"};
//   Expr parsedExpr = parseExpr(tokens);
//   std::cout << int(parsedExpr.type);
//   std::cout << parsedExpr.toString() << std::endl;

//   std::vector<std::string> tokens2 = {"(", "\"", "hello", "\"",    "(", "+",
//                                       "1", "1",  ")",     "world", ")"};
//   Expr parsedExpr2 = parseExpr(tokens2);
//   std::cout << int(parsedExpr2.type);
//   std::cout << parsedExpr2.toString() << std::endl;

//   return 0;
// };

#endif