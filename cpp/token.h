#ifndef TOKEN_H
#define TOKEN_H

#include <string>
#include <vector>

// 声明函数
std::string preprocessString(const std::string &expr);
std::vector<std::string> tokenize(const std::string &expr);

#endif // TOKEN_H
