#include <iostream>
#include <list>
#include <string_view>
#include <cctype> // for isspace
#include <string>

using namespace std;

class LispObject {
public:
    virtual ~LispObject() {}
    virtual void print() const = 0; // 为所有对象提供一个输出接口
};

class LispString : public LispObject {
public:
    string_view str;
    LispString(string_view str) : str(str) {}

    void print() const override {
        cout << "\"" << str << "\"";
    }
};

class LispNumber : public LispObject {
public:
    double value;
    LispNumber(double value) : value(value) {}

    void print() const override {
        cout << value;
    }
};

// 分词函数
void tokenize(string_view input, list<string_view>& tokens) {
    auto start = input.begin();
    while (start != input.end()) {
        if (isspace(*start)) {
            ++start; // Skip whitespace
        } else if (*start == '(' || *start == ')') {
            // Handle single-character tokens
            tokens.emplace_back(start, 1); // Create string_view with one char
            ++start;
        } else {
            // Handle general tokens
            auto end = start;
            while (end != input.end() && !isspace(*end) && *end != '(' && *end != ')') {
                ++end;
            }
            tokens.emplace_back(start, std::distance(start, end)); // Create string_view
            start = end;
        }
    }
}

// 执行表达式
LispObject* exeExpr(list<string_view>& tokens) {
    if (tokens.empty()) return nullptr;

    string_view token = tokens.front();
    tokens.pop_front();

    if (token == "define") {
        // Handle define expression
        string_view var_name = tokens.front();
        tokens.pop_front();

        // 假设定义一个数字变量
        double value = std::stod(string(tokens.front())); // 将字符串转换为数字
        tokens.pop_front();

        // 返回一个 LispNumber 对象
        return new LispNumber(value);
    }

    // 在这里可以根据具体需求进一步扩展解析其他表达式

    return nullptr;
}

// 执行输入的 tokens
LispObject* exe(list<string_view>& tokens) {
    if (tokens.empty()) return nullptr;

    if (tokens.front() == "exit") {
        return nullptr; // exit 表示退出
    }

    if (tokens.front() == "(") {
        tokens.pop_front();
        return exeExpr(tokens); // 解析括号中的表达式
    }

    return nullptr;
}

// 运行输入并执行解析和计算
void run(string_view input) {
    std::list<std::string_view> tokens;
    tokenize(input, tokens); // 分词

    LispObject* result = exe(tokens); // 执行表达式

    if (result) {
        result->print(); // 打印结果
        cout << endl;
        delete result; // 释放内存
    } else {
        cout << "No result or exit" << endl;
    }
}

int main() {
    std::string input = "(define square 3.14)";

    run(input); // 运行表达式

    return 0;
}
