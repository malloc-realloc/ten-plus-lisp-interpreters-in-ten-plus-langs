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
        return "\"" + value + "\"";  
    }
    
    unique_ptr<Obj> clone() const override {
        return make_unique<StringObj>(value);
    }
};

class LambdaObj : public Obj {
public:
    vector<string> params; 
    string body;           
    
    LambdaObj(const vector<string>& params, const string& body) 
        : params(params), body(body) {}

    string toString() const override {
        string result = "(lambda (";
        for (size_t i = 0; i < params.size(); i++) {
            if (i > 0) result += " ";
            result += params[i];
        }
        result += ") ";
        result += body;
        result += ")";
        return result;
    }
    
    unique_ptr<Obj> clone() const override {
        return make_unique<LambdaObj>(params, body);
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

string getNextToken(size_t& pos, const string& expr, const string& expected) {
    string token = getNextToken(pos, expr);
    if (token != expected) {
        throw runtime_error("Syntax error: expected '" + expected + "', got '" + token + "'");
    }
    return token;
}


void skipExpr(size_t &pos, const string& expr) {
    while (pos < expr.size() && isspace(expr[pos])) {
        pos++;
    }
    
    if (pos >= expr.size()) {
        return;
    }
    
    if (expr[pos] == '(') {
        pos++; 
        int bracketCount = 1;
        
        while (pos < expr.size() && bracketCount > 0) {
            if (expr[pos] == '(') {
                bracketCount++;
            } else if (expr[pos] == ')') {
                bracketCount--;
            }
            pos++;
        }
        
        if (bracketCount > 0) {
            throw runtime_error("Unmatched parentheses");
        }
    } else {
        getNextToken(pos, expr);
    }
}

ObjPtr evalExpr(Env& env, size_t& pos, const string& expr) {
    string token = getNextToken(pos, expr);
    
    if (token.empty()) {
        return nullptr;
    }
    
    if (token == "(") {
        auto result = evalExpr(env, pos, expr);
        getNextToken(pos, expr);  
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
            env.set(name, value->clone()); 
            return value;
        }
        return nullptr;
    }
    
    if (token == "if") {
        auto condition = evalExpr(env, pos, expr);
        if (!condition) {
            return nullptr;
        }
        
        bool isTrue = false;
        if (auto* numObj = dynamic_cast<NumberObj*>(condition.get())) {
            isTrue = numObj->value != 0;
        }
        
        if (!isTrue) {
            skipExpr(pos, expr);
            return make_unique<NumberObj>(0);
        } else {
            auto out =  evalExpr(env, pos, expr);
            skipExpr(pos,expr);
            return out;
        }
    }

    if (token == "lambda") {
        token = getNextToken(pos, expr);  
        if (token != "(") {
            return nullptr;
        }
        
        vector<string> params;
        while (true) {
            token = getNextToken(pos, expr);
            if (token == ")") break;
            if (token.empty()) return nullptr;
            params.push_back(token);
        }
        
        string body;
        int parenCount = 0;
        bool started = false;
        
        while (pos < expr.size()) {
            char c = expr[pos];
            if (c == '(') {
                started = true;
                parenCount++;
                body += c;
            } else if (c == ')') {
                parenCount--;
                body += c;
                if (started && parenCount == 0) {
                    pos++;
                    break;
                }
            } else {
                body += c;
            }
            pos++;
        }
        
        return make_unique<LambdaObj>(params, body);
    }

  
    if (env.contains(token)) {
        auto obj = env.getClone(token);
        if (auto* lambda = dynamic_cast<LambdaObj*>(obj.get())) {
            vector<unique_ptr<Obj>> args;
            for (size_t i = 0; i < lambda->params.size(); i++) {
                auto arg = evalExpr(env, pos, expr);
                if (!arg) return nullptr;
                args.push_back(std::move(arg));
            }
            
            Env newEnv(&env);  
            for (size_t i = 0; i < lambda->params.size(); i++) {
                newEnv.set(lambda->params[i], args[i]->clone());
            }
            
            size_t bodyPos = 0;
            return evalExpr(newEnv, bodyPos, lambda->body);
        }
        return obj; 
    }
    
    cout << "Invalid Input: " << token << endl;
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
            while (pos != expr.size()) {
                auto result = evalExpr(globalEnv, pos, expr); 
                if (result) {
                    cout << result->toString() << endl;
                }
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