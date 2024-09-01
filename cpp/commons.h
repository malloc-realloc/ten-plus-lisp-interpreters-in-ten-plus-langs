#ifndef COMMON_H
#define COMMON_H

#include <any>
#include <cmath>
#include <iostream>
#include <map>
#include <memory>
#include <stdexcept>
#include <string>
#include <unordered_set>
#include <vector>

using std::string;
using std::vector;
using Atom = std::string;
using std::any;

template <typename T>
std::unordered_set<std::string>
extractKeys(const std::unordered_map<std::string, T> &map) {
  std::unordered_set<std::string> keys;
  for (const auto &pair : map) {
    keys.insert(pair.first);
  }
  return keys;
}

#endif