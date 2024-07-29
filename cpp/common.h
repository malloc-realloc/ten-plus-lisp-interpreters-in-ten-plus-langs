#ifndef COMMON_H
#define COMMON_H

#include <iostream>
#include <memory>
#include <regex>
#include <sstream>
#include <string>
#include <type_traits>
#include <variant>
#include <vector>

std::string preprocessString(const std::string &expr);
std::vector<std::string> tokenize(const std::string &expr);

#endif