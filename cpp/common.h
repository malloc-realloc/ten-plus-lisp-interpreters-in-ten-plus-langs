#ifndef COMMON_H
#define COMMON_H

#include "ast.h"
#include "obj.h"
// #include "parser.h"

std::string preprocessString(const std::string &expr);
std::vector<Atom> tokenize(const std::string &expr);
// std::shared_ptr<LispExpr> parseLispExpr(std::vector<std::string> &tokens);

#endif