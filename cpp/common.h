#ifndef COMMON_H
#define COMMON_H

#include <iostream>
#include <memory>
#include <regex>
#include <sstream>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <variant>
#include <vector>

#include "ast.h"

std::string preprocessString(const std::string &expr);
std::vector<std::string> tokenize(const std::string &expr);

#endif