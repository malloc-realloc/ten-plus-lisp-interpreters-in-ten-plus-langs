#include "token.h"
#include <regex>

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

std::vector<std::string> tokenize(const std::string &expr) {
  std::string processedExpr = preprocessString(expr);
  std::vector<std::string> result;
  size_t length = processedExpr.length();

  for (size_t i = 0; i < length; ++i) {
    if (processedExpr[i] == ' ') {
      continue;
    } else if (processedExpr[i] == '(' || processedExpr[i] == ')') {
      result.push_back(std::string(1, processedExpr[i]));
    } else if (processedExpr[i] == '"') {
      std::string token = "\"";
      ++i;
      while (i < length && processedExpr[i] != '"') {
        token += processedExpr[i++];
      }
      token += '"';
      result.push_back(token);
    } else if (processedExpr[i] == '{') {
      std::string token = "{";
      ++i;
      result.push_back("{");
      while (i < length && processedExpr[i] != '}') {
        token += processedExpr[i++];
      }
      token += '}';
      result.push_back(token);
      result.push_back("}");
    } else {
      std::string token;
      while (i < length && processedExpr[i] != ' ' && processedExpr[i] != ')') {
        token += processedExpr[i++];
      }
      --i;
      result.push_back(token);
    }
  }

  return result;
}