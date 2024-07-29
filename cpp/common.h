#ifndef COMMON_H
#define COMMON_H

#include "ast.h"
#include "obj.h"

std::string preprocessString(const std::string &expr);
std::vector<std::string> tokenize(const std::string &expr);
std::shared_ptr<LispExpr> parseLispExpr();

#endif