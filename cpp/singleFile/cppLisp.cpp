#include <algorithm>
#include <cctype>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

class Obj;
class Env;
using ObjPtr = unique_ptr<Obj>;
ObjPtr evalExprs(Env &, size_t&, const string&, size_t end);

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

class VoidObj : public Obj {
public:
    VoidObj() = default;
    
    string toString() const override {
        return "";  // Void objects don't print anything
    }
    
    unique_ptr<Obj> clone() const override {
        return make_unique<VoidObj>();
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

    bool containsLocal(const string& name) const {
        return values.count(name) > 0;
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

    // add setExisting so that set! works
    bool setExisting(const string& name, unique_ptr<Obj> value) {
        if (values.count(name) > 0) {
            values[name] = std::move(value);
            return true;
        }
        return parent ? parent->setExisting(name, std::move(value)) : false;
    }

    Env* findDefiningScope(const string& name) {
        if (values.count(name) > 0) {
            return this;
        }
        return parent ? parent->findDefiningScope(name) : nullptr;
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

    if (token == "begin") {
        unique_ptr<Obj> lastResult;
        while (true) {
            auto result = evalExpr(env, pos, expr);
            if (!result) break;
            lastResult = std::move(result);
            
            string next = getNextToken(pos, expr);
            if (next == ")") break;
            pos -= next.length();
        }
        return lastResult ? std::move(lastResult) : make_unique<VoidObj>();
    }

    if (token == "display") {
        auto value = evalExpr(env, pos, expr);
        if (value) {
            if (auto* strObj = dynamic_cast<StringObj*>(value.get())) {
                cout << strObj->value << endl;  // Print string without quotes
            } else {
                cout << value->toString() << endl;
            }
        }
        return make_unique<VoidObj>();
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
            auto out = evalExpr(env, pos, expr);
            skipExpr(pos,expr);
            return out;
        }
    }

    if (token == "while") {
        auto conditionPosition = pos;
        auto condition = evalExpr(env, pos, expr);
        if (!condition) {
            return nullptr;
        }

        bool isTrue = false;
        if (auto* numObj = dynamic_cast<NumberObj*>(condition.get())) {
            isTrue = numObj->value != 0;
        }

        auto bodyPosition = pos;
        unique_ptr<Obj> lastResult;

        while (isTrue) {
            unique_ptr<Obj> bodyResult;
            while (pos < expr.size()) {
                auto result = evalExpr(env, pos, expr);
                if (!result) {
                    return nullptr;
                }
                bodyResult = std::move(result);

                string next = getNextToken(pos, expr);
                if (next == ")") {
                    break;
                }
                pos -= next.length(); 
            }
            lastResult = std::move(bodyResult);

            pos = conditionPosition;
            condition = evalExpr(env, pos, expr);
            if (!condition) {
                return nullptr;
            }

            if (auto* numObj = dynamic_cast<NumberObj*>(condition.get())) {
                isTrue = numObj->value != 0;
            } else {
                return nullptr;
            }

            if (isTrue) {
                pos = bodyPosition;
            }
        }

        if (!isTrue) {
            skipExpr(pos, expr);
        }

        return lastResult ? std::move(lastResult) : make_unique<NumberObj>(0);
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

    if (token == "let") {
        // Create new environment for let
        Env newEnv(&env);
        
        // Read opening parenthesis for bindings
        token = getNextToken(pos, expr);
        if (token != "(") {
            throw runtime_error("let: expected binding list");
        }
        
        // Process bindings
        while (true) {
            token = getNextToken(pos, expr);
            if (token == ")") break;
            
            if (token != "(") {
                throw runtime_error("let: malformed binding");
            }
            
            string varName = getNextToken(pos, expr);
            auto value = evalExpr(env, pos, expr);  // Note: evaluate in outer env
            if (!value) {
                throw runtime_error("let: invalid binding value");
            }
            
            newEnv.set(varName, std::move(value));
            
            // Skip closing parenthesis of this binding
            getNextToken(pos, expr);
        }
        
        // Evaluate body in new environment
        unique_ptr<Obj> result;
        while (true) {
            auto expr_result = evalExpr(newEnv, pos, expr);
            if (!expr_result) break;
            result = std::move(expr_result);
            
            string next = getNextToken(pos, expr);
            if (next == ")") break;
            pos -= next.length();
        }
        
        return result ? std::move(result) : make_unique<VoidObj>();
    }

    if (token == "set!") {
        string name = getNextToken(pos, expr);
        if (!env.contains(name)) {
            throw runtime_error("set!: variable not defined: " + name);
        }
        auto value = evalExpr(env, pos, expr);
        if (!value) {
            throw runtime_error("set!: invalid value");
        }
        if (!env.setExisting(name, value->clone())) {
            throw runtime_error("set!: variable not found: " + name);
        }
        return value;
    }
    
    if (token == "eval") {
        // Evaluate the expression to get the string to be evaluated
        auto stringObj = evalExpr(env, pos, expr);
        if (!stringObj) {
            throw runtime_error("eval: expression evaluated to null");
        }
        
        // Check if the result is a StringObj
        auto* strObj = dynamic_cast<StringObj*>(stringObj.get());
        if (!strObj) {
            throw runtime_error("eval: expression must evaluate to a string");
        }
        
        // Get the new expression to evaluate
        string newExpr = strObj->value;
        size_t newPos = 0;
        
        // Evaluate the new expression
        return evalExprs(env, newPos, newExpr, newExpr.size());
    }
    
    cout << "Invalid Input: " << token << endl;
    return nullptr;
}

ObjPtr evalExprs(Env &env, size_t& pos, const string& expr, size_t end) {
    ObjPtr result = nullptr;
    while (pos < end) {
        result = evalExpr(env, pos, expr); 
        if (result && !dynamic_cast<VoidObj*>(result.get())) {
            cout << result->toString() << endl;
        }
    }
    return result;
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
            evalExprs(globalEnv, pos, expr, expr.size());
            // while (pos != expr.size()) {
            //     auto result = evalExpr(globalEnv, pos, expr); 
            //     if (result && !dynamic_cast<VoidObj*>(result.get())) {
            //         cout << result->toString() << endl;
            //     }
            // }
        } catch (const exception& e) {
            cout << "Error: " << e.what() << endl;
        }
    }
}

int main() {
    repl();
    return 0;
}