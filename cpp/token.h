#include "commons.h"

std::string preprocessString(const std::string &expr) {
  std::string result = expr;
  size_t pos = 0;

  // Replace '(' with '( ' and ')' with ' )'
  while ((pos = result.find('(', pos)) != std::string::npos) {
    result.replace(pos, 1, "( ");
    pos += 2; // Move past the replacement
  }

  pos = 0;
  while ((pos = result.find(')', pos)) != std::string::npos) {
    result.replace(pos, 1, " )");
    pos += 2; // Move past the replacement
  }

  return result;
}

std::vector<std::string> tokenize(const std::string &expr) {
  try {
    std::string processedExpr = preprocessString(expr);
    std::vector<std::string> result;
    size_t i = 0;

    while (i < processedExpr.length()) {
      if (processedExpr[i] == ' ') {
        // skip spaces
        ++i;
      } else if (processedExpr[i] == '(' || processedExpr[i] == ')') {
        result.push_back(std::string(1, processedExpr[i]));
        ++i;
      } else if (processedExpr[i] == '"') {
        result.push_back("\"");
        std::string token = "";
        ++i;
        while (i < processedExpr.length() && processedExpr[i] != '"') {
          token += processedExpr[i];
          ++i;
        }
        result.push_back(token);
        result.push_back("\"");
        ++i;
      } else if (processedExpr[i] == '\'') {
        // '' contains comments
        ++i;
        while (i < processedExpr.length() && processedExpr[i] != '\'') {
          ++i;
        }
        ++i;
      } else {
        std::string token;
        while (i < processedExpr.length() && processedExpr[i] != ' ' &&
               processedExpr[i] != ')') {
          token += processedExpr[i];
          ++i;
        }
        result.push_back(token);
      }
    }

    return result;
  } catch (...) {
    return std::vector<std::string>();
  }
}

// int main() {
//   std::string expr = "(example 'comment' \"text\")(define r 1)(define fn "
//                      "(lambda (x) (define r 2) (+ x r)))(fn 2) 2 \"ha\" ";
//   std::vector<std::string> tokens = tokenize(expr);

//   for (const std::string &token : tokens) {
//     std::cout << token << std::endl;
//   }

//   return 0;
// }
