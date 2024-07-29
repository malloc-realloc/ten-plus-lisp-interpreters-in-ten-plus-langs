#ifndef TOKEN_H
#define TOKEN_H

#include "common.h"
#include <memory>
#include <regex>
#include <string>
#include <vector>

std::string preprocessString(const std::string &expr) {
  std::string result = expr;

  // Use a regular expression with global replacement to handle all instances of
  // `(
  result = std::regex_replace(result, std::regex("`\\("), "(quote ");

  // Regular expression to handle different patterns preceded by a backtick
  result = std::regex_replace(
      result, std::regex("`([\\w+\\-*/!@#$%^&=<>?]+|[^\\s\\(\\)]+)"),
      "(quote $1)");

  return result;
}

std::vector<Atom> tokenize(const std::string &expr) {
  std::string processedLispExpr = preprocessString(expr);
  std::vector<Atom> result;
  size_t length = processedLispExpr.length();

  for (size_t i = 0; i < length; ++i) {
    if (processedLispExpr[i] == ' ') {
      continue;
    } else if (processedLispExpr[i] == '(' || processedLispExpr[i] == ')') {
      result.push_back(Atom(std::string(1, processedLispExpr[i])));
    } else if (processedLispExpr[i] == '"') {
      std::string token = "\"";
      ++i;
      while (i < length && processedLispExpr[i] != '"') {
        token += processedLispExpr[i++];
      }
      token += '"';
      result.push_back(Atom(token));
    } else if (processedLispExpr[i] == '{') {
      std::string token = "{";
      ++i;
      result.push_back(Atom("{"));
      while (i < length && processedLispExpr[i] != '}') {
        token += processedLispExpr[i++];
      }
      token += '}';
      result.push_back(Atom(token));
      result.push_back(Atom("}"));
    } else {
      std::string token;
      while (i < length && processedLispExpr[i] != ' ' &&
             processedLispExpr[i] != ')') {
        token += processedLispExpr[i++];
      }
      --i;
      result.push_back(Atom(token));
    }
  }

  return result;
}

#endif