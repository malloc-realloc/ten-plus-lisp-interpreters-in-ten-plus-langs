#ifndef PARSER_H
#define PARSER_H

#include "ast.h"
#include <memory>
#include <stdexcept>
#include <vector>

std::shared_ptr<LispExpr> parseLispExpr(std::vector<Atom> &tokens) {
  if (tokens.empty()) {
    throw std::runtime_error("Unexpected end of tokens");
  }

  Atom token = tokens.front();
  tokens.erase(tokens.begin());

  if (token == "\"") {
    if (tokens.empty()) {
      throw std::runtime_error("Unexpected end of tokens");
    }
    auto expr =
        std::make_shared<LispExpr>(LispExprType::STRING_EXPR, tokens.front());
    tokens.erase(tokens.begin());
    if (!tokens.empty()) {
      tokens.erase(tokens.begin()); // remove second \"
    }
    return expr;
  }

  if (token == "{") {
    if (tokens.empty()) {
      throw std::runtime_error("Unexpected end of tokens");
    }
    auto llmLispExpr =
        std::make_shared<LispExpr>(LispExprType::LLM_EXPR, tokens.front());
    tokens.erase(tokens.begin());
    if (!tokens.empty()) {
      tokens.erase(tokens.begin()); // 移除右花括号
    }
    return llmLispExpr;
  }

  // if (token == "(") {
  //   std::vector<std::shared_ptr<LispExpr>> lstLispExpr;
  //   while (!tokens.empty() && tokens.front() != ")") {
  //     lstLispExpr.push_back(parseLispExpr(tokens));
  //   }
  //   if (tokens.empty()) {
  //     throw std::runtime_error("Unexpected end of tokens");
  //   }
  //   tokens.erase(tokens.begin()); // 移除右括号
  //   return std::make_shared<LispExpr>(LispExprType::LST_EXPR,
  //                                     convertToLiteral(lstLispExpr));
  // }

  return std::make_shared<LispExpr>(LispExprType::ATOM, token);
}

#endif