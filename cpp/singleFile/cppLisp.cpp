#include <algorithm>
#include <cctype>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

class Obj;
using ObjPtr = unique_ptr<Obj>;

static const unordered_map<string, function<double(double, double)>> operators = {
    {"+", plus<double>()},
    {"-", minus<double>()},
    {"*", multiplies<double>()},
    {"/", divides<double>()}
};

static const vector<char> keywords{'\"', ')', '('};

class Obj {
public:
    virtual ~Obj() = default;
    virtual string toString() const = 0;
    virtual unique_ptr<Obj> clone() const = 0;
};

class NumberObj : public Obj {
public:
    double value;
    explicit NumberObj(double v) : value(v) {}
    
    string toString() const override {
        return to_string(value);
    }
    
    unique_ptr<Obj> clone() const override {
        return make_unique<NumberObj>(value);
    }
};

class StringObj : public Obj {
public:
    string value;
    explicit StringObj(string v) : value(std::move(v)) {}
    
    string toString() const override {
        return "\"" + value + "\"";  // 修复字符串输出格式
    }
    
    unique_ptr<Obj> clone() const override {
        return make_unique<StringObj>(value);
    }
};

class Env {
private:
    unordered_map<string, unique_ptr<Obj>> values;
    Env* parent;

public:
    explicit Env(Env* p = nullptr) : parent(p) {}
    
    Env(const Env&) = delete;
    Env& operator=(const Env&) = delete;
    
    Env(Env&&) = default;
    Env& operator=(Env&&) = default;
    
    bool contains(const string& name) const {
        return values.count(name) > 0 || (parent && parent->contains(name));
    }

    const Obj* get(const string& name) const {
        auto it = values.find(name);
        if (it != values.end()) {
            return it->second.get();
        }
        return parent ? parent->get(name) : nullptr;
    }

    void set(const string& name, unique_ptr<Obj> value) {
        values[name] = std::move(value);
    }

    unique_ptr<Obj> getClone(const string& name) const {
        const Obj* obj = get(name);
        return obj ? obj->clone() : nullptr;
    }
};

string getNextToken(size_t& pos, const string& expr) {
    while (pos < expr.size() && isspace(expr[pos])) {
        pos++;
    }

    if (pos >= expr.size()) {
        return "";
    }

    if (find(keywords.begin(), keywords.end(), expr[pos]) != keywords.end()) {
        return string(1, expr[pos++]);
    }

    string token;
    while (pos < expr.size() && !isspace(expr[pos]) && 
           expr[pos] != '(' && expr[pos] != ')') {
        token += expr[pos++];
    }
    return token;
}

unique_ptr<Obj> evalExpr(Env& env, size_t& pos, const string& expr) {  // 修改为非const Env
    string token = getNextToken(pos, expr);
    
    if (token.empty()) {
        return nullptr;
    }

    if (token == "(") {
        auto result = evalExpr(env, pos, expr);
        getNextToken(pos, expr);  // 消耗右括号
        return result;
    }

    if (!token.empty() && (isdigit(token[0]) || (token[0] == '-' && token.length() > 1))) {
        try {
            return make_unique<NumberObj>(stod(token));
        } catch (...) {
            return nullptr;
        }
    }

    if (operators.count(token) > 0) {
        auto op = operators.at(token);
        vector<double> numbers;
        
        while (true) {
            auto nextObj = evalExpr(env, pos, expr);
            if (!nextObj) break;
            
            if (auto* numObj = dynamic_cast<NumberObj*>(nextObj.get())) {
                numbers.push_back(numObj->value);
            }
            
            string next = getNextToken(pos, expr);
            if (next == ")") break;
            pos -= next.length();
        }

        if (numbers.empty()) {
            return make_unique<NumberObj>(0);
        }

        double result = numbers[0];
        for (size_t i = 1; i < numbers.size(); i++) {
            result = op(result, numbers[i]);
        }
        return make_unique<NumberObj>(result);
    }

    if (token == "\"") {
        string str;
        while (pos < expr.size() && expr[pos] != '\"') {
            str += expr[pos++];
        }
        pos++;  
        return make_unique<StringObj>(str);
    }

    if (token == "define") {
        string name = getNextToken(pos, expr);
        auto value = evalExpr(env, pos, expr);
        if (value) {
            env.set(name, std::move(value));
            return make_unique<StringObj>("Defined " + name);
        }
        return nullptr;
    }

    if (env.contains(token)) {
        return env.getClone(token);
    }

    return nullptr;
}

void repl() {
    Env globalEnv;
    
    while (true) {
        cout << ">> ";
        string expr;
        getline(cin, expr);
        
        if (expr == "exit") break;
        
        try {
            size_t pos = 0;
            auto result = evalExpr(globalEnv, pos, expr);  // 直接使用 globalEnv
            if (result) {
                cout << result->toString() << endl;
            }
        } catch (const exception& e) {
            cout << "Error: " << e.what() << endl;
        }
    }
}

int main() {
    repl();
    return 0;
}