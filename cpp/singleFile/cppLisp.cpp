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
        return value;
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

unique_ptr<Obj> evalExpr(const Env& env, size_t& pos, const string& expr) {
    string token = getNextToken(pos, expr);
    
    if (token.empty()) {
        return nullptr;
    }

    if (token == "(") {
        auto result = evalExpr(env, pos, expr);
        return result;
    }

    if (!token.empty() && all_of(token.begin(), token.end(), 
        [](char c) { return isdigit(c) || c == '.'; })) {
        return make_unique<NumberObj>(stod(token));
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
        return make_unique<StringObj>(str);
    }

    if (env.contains(token)) {
        return env.getClone(token);
    }

    return make_unique<NumberObj>(0);
}

void repl() {
    Env globalEnv;
    
    while (true) {
        cout << ">> ";
        string expr;
        getline(cin, expr);
        
        if (expr == "exit") break;
        
        try {
            Env localEnv(&globalEnv);
            
            size_t pos = 0;
            auto result = evalExpr(localEnv, pos, expr);
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