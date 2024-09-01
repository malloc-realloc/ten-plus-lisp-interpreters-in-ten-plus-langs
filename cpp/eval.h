#ifndef BUILTIN_H
#define BUILTIN_H

#include "ast.h"
#include "commons.h"
#include "env.h"
#include "obj.h"
#include <any>
#include <cmath>
#include <iostream>
#include <map>
#include <string>
#include <vector>

Obj evalAtom(Env &env, const Expr &expr);
Obj evalStringExpr(const Expr &expr);
Obj evalListExpr(Env &env, const Expr &expr);
Obj evalExpr(Env &env, const Expr &expr);
bool isInt(const std::string &s);
bool isFloat(const std::string &s);

const IntNumber TsLispInnerFalse(0);
const IntNumber TsLispInnerTrue(1);

ErrorObj handleError(Env &env, const std::string &operation) {
  env.setErrorMessage(operation);
  return ErrorObj("");
}

Obj evalLambdaObj(Env &env, const Procedure &procedure,
                  const std::vector<Expr> &exprList);
bool isTsLispFalse(const Obj &obj);

bool isTsLispFalse(const Obj &obj) {
  if (&obj == &FALSE || &obj == &None_Obj) {
    return true;
  }

  try {
    int value = std::any_cast<int>(obj.value);
    return value == 0;
  } catch (const std::bad_any_cast &) {
    return false;
  }
}

Obj addObjs(Env &env, const std::vector<Obj> &args) {
  try {
    if (args.empty()) {
      throw handleError(env, "At least one argument is required");
    }

    if (TCast<String_Obj>(args[0])) {
      std::string result = "";
      for (const auto &arg : args) {
        result += std::any_cast<std::string>(arg);
      }
      return String_Obj(result);
    } else {
      int result = 0;
      for (const auto &arg : args) {
        if (TCast<IntNumber>(arg)) {
          result += std::any_cast<double>(arg);
        } else {
          return handleError(
              env,
              "+ cannot be applied to objects with type except number, string");
        }
      }
      return IntNumber(result);
    }
  } catch (const std::exception &error) {
    return handleError(env, "+");
  }
}

Obj subObjs(Env &env, const std::vector<Obj> &args) {
  try {
    int result = std::any_cast<double>(args[0]);
    for (size_t i = 1; i < args.size(); ++i) {
      if (TCast<IntNumber>(args[i])) {
        result -= std::any_cast<int>(args[i]);
      } else {
        return handleError(env, "-");
      }
    }
    return IntNumber(result);
  } catch (const std::exception &error) {
    return handleError(env, "-");
  }
}

Obj powerObjs(Env &env, const std::vector<Obj> &args) {
  try {
    auto obj1 = args[0];
    auto obj2 = args[1];
    double result = std::pow(std::any_cast<double>(obj1.value),
                             std::any_cast<double>(obj2.value));
    if (std::floor(result) == result) {
      return IntNumber(static_cast<double>(result));
    } else {
      return FloatNumber(result);
    }
  } catch (const std::exception &error) {
    return handleError(env, "**");
  }
}

Obj mulObjs(Env &env, const std::vector<Obj> &args) {
  try {
    int result = 1;
    for (const auto &arg : args) {
      result *= std::any_cast<double>(arg);
    }
    return IntNumber(result);
  } catch (const std::exception &error) {
    return handleError(env, "*");
  }
}

Obj makeStr(Env &env, const std::vector<Obj> &objs) {
  try {
    std::string s = "";
    for (size_t i = 1; i < objs.size(); ++i) {
      s += std::any_cast<std::string>(objs[i].value);
      s += std::any_cast<std::string>(objs[0].value);
    }
    return String_Obj(s.substr(0, s.size() - 1));
  } catch (const std::exception &error) {
    return handleError(env, "str");
  }
}

Obj divObjs(Env &env, const std::vector<Obj> &args) {
  try {
    double result = std::any_cast<double>(args[0]);
    for (size_t i = 1; i < args.size(); ++i) {
      if (std::any_cast<double>(args[i]) == 0) {
        throw handleError(env, "Division by zero");
      }
      result /= std::any_cast<double>(args[i]);
    }
    return IntNumber(static_cast<double>(result));
  } catch (const std::exception &error) {
    return handleError(env, "/");
  }
}

Obj listObj(Env &env, const std::vector<Obj> &args) {
  try {
    std::vector<Obj> objList;
    for (const auto &arg : args) {
      objList.push_back(arg);
    }
    return List_Obj(objList, ObjType::LIST_OBJ);
  } catch (const std::exception &error) {
    return handleError(env, "list");
  }
}

Obj dictObj(Env &env, const std::vector<Obj> &args) {
  try {
    std::map<std::string, Obj> objMap;
    for (size_t i = 0; i < args.size(); i += 2) {
      if (args[i].value.type() != typeid(std::string)) {
        throw handleError(env, "key must be string");
      }
      objMap[std::any_cast<std::string>(args[i].value)] = args[i + 1];
    }
    return Dict_Obj(objMap, ObjType::DICT_OBJ);
  } catch (const std::exception &error) {
    return handleError(env, "dict");
  }
}

Obj gtObjs(Env &env, const std::vector<Obj> &args) {
  try {
    Obj arg1 = args[0];
    Obj arg2 = args[1];
    return std::any_cast<double>(arg1.value) > std::any_cast<double>(arg2.value)
               ? TRUE
               : FALSE;
  } catch (const std::exception &error) {
    return handleError(env, ">");
  }
}

Obj ltObjs(Env &env, const std::vector<Obj> &args) {
  try {
    Obj arg1 = args[0];
    Obj arg2 = args[1];
    return std::any_cast<double>(arg1.value) < std::any_cast<double>(arg2.value)
               ? TRUE
               : FALSE;
  } catch (const std::exception &error) {
    return handleError(env, "<");
  }
}

Obj geObjs(Env &env, const std::vector<Obj> &args) {
  try {
    Obj arg1 = args[0];
    Obj arg2 = args[1];
    return std::any_cast<double>(arg1.value) >=
                   std::any_cast<double>(arg2.value)
               ? TRUE
               : FALSE;
  } catch (const std::exception &error) {
    return handleError(env, ">=");
  }
}

Obj leObjs(Env &env, const std::vector<Obj> &args) {
  try {
    Obj arg1 = args[0];
    Obj arg2 = args[1];
    return std::any_cast<double>(arg1.value) <=
                   std::any_cast<double>(arg2.value)
               ? TRUE
               : FALSE;
  } catch (const std::exception &error) {
    return handleError(env, "<=");
  }
}

Obj eqObjs(Env &env, const std::vector<Obj> &args) {
  try {
    Obj arg1 = args[0];
    Obj arg2 = args[1];
    if (arg1.value.type() == typeid(double) &&
        arg2.value.type() == typeid(double)) {
      return std::any_cast<double>(arg1.value) ==
                     std::any_cast<double>(arg2.value)
                 ? TRUE
                 : FALSE;
    } else if (arg1.value.type() == typeid(float) &&
               arg2.value.type() == typeid(float)) {
      return std::any_cast<float>(arg1.value) ==
                     std::any_cast<float>(arg2.value)
                 ? TRUE
                 : FALSE;
    } else if (arg1.value.type() == typeid(std::string) &&
               arg2.value.type() == typeid(std::string)) {
      return std::any_cast<std::string>(arg1.value) ==
                     std::any_cast<std::string>(arg2.value)
                 ? TRUE
                 : FALSE;
    } else {
      return FALSE;
    }
  } catch (const std::exception &error) {
    return handleError(env, "=");
  }
}

Obj absObj(Env &env, const std::vector<Obj> &args) {
  try {
    Obj arg = args[0];
    int result = std::abs(std::any_cast<double>(arg));
    return IntNumber(result);
  } catch (const std::exception &error) {
    return handleError(env, "abs");
  }
}

Obj display(Env &env, const std::vector<Obj> &args) {
  try {
    for (const auto &arg : args) {
      if (arg.value.type() == typeid(std::string)) {
        std::cout << std::any_cast<std::string>(arg.value) << std::endl;
      } else if (arg.value.type() == typeid(double)) {
        std::cout << std::any_cast<double>(arg.value) << std::endl;
      } else if (arg.value.type() == typeid(int)) {
        std::cout << std::any_cast<int>(arg.value) << std::endl;
      } else {
        std::cout << "unable to display this type" << std::endl;
      }
    }
    return args.back(); // 返回最后一个参数
  } catch (const std::exception &error) {
    return handleError(env, "display");
  }
}

Obj begin(Env &env, const std::vector<Obj> &args) {
  try {
    return args.back();
  } catch (const std::exception &error) {
    return handleError(env, "begin");
  }
}

Obj getFromContainer(Env &env, const std::vector<Obj> &args) {
  try {
    const auto obj0 = args[1];
    const auto obj1 = args[0];

    if (std::any_cast<List_Obj>(obj1).type == ObjType::LIST_OBJ) {
      int index = std::any_cast<int>(obj0.value);
      auto list = std::any_cast<std::vector<Obj>>(obj1.value);
      if (index < 0 || index >= list.size()) {
        throw handleError(env, "Index out of bounds");
      }
      return list[index];
    } else if (std::any_cast<Dict_Obj>(obj1).type == ObjType::DICT_OBJ) {
      auto dict = std::any_cast<std::map<std::string, Obj>>(obj1.value);
      std::string key = std::any_cast<std::string>(obj0.value);
      auto it = dict.find(key);
      if (it == dict.end()) {
        throw handleError(env, "Key not found");
      }
      return it->second;
    }
    throw handleError(env, "Invalid container type");
  } catch (const std::exception &error) {
    return handleError(env, "get");
  }
}

Obj setContainer(Env &env, const std::vector<Obj> &args) {
  try {
    const auto obj0 = args[1];
    const auto obj1 = args[0];
    const auto value = args[2];
    if (std::any_cast<List_Obj>(obj1).type == ObjType::LIST_OBJ) {
      int index = std::any_cast<int>(obj0.value);
      auto list = std::any_cast<std::vector<Obj>>(obj1.value);
      if (index < 0 || index >= list.size()) {
        throw handleError(env, "Index out of bounds");
      }
      list[index] = value;
      return value;
    } else if (std::any_cast<Dict_Obj>(obj1).type == ObjType::DICT_OBJ) {
      auto dict = std::any_cast<std::map<std::string, Obj>>(obj1.value);
      std::string key = std::any_cast<std::string>(obj0.value);
      dict[key] = value;
      return value;
    }
    throw handleError(env, "Invalid container type");
  } catch (const std::exception &error) {
    return handleError(env, "set");
  }
}

Obj returnFunc(Env &env, const std::vector<Obj> &args) {
  try {
    // 假设 env.functionDepth 是一个整型成员变量
    env.functionDepth--;
    return args[0];
  } catch (const std::exception &error) {
    return handleError(env, "return");
  }
}

Obj pushIntoContainer(Env &env, const std::vector<Obj> &args) {
  try {
    if (std::any_cast<List_Obj>(args[0]).type == ObjType::LIST_OBJ) {
      auto list = std::any_cast<std::vector<Obj>>(args[0].value);
      list.push_back(args[1]);
      return args[1];
    }
    throw handleError(env, "Invalid container type");
  } catch (const std::exception &error) {
    return handleError(env, "push");
  }
}

Obj randomFunc(Env &env, const std::vector<Obj> &args) {
  try {
    int n1 = std::any_cast<int>(args[0].value);
    int n2 = std::any_cast<int>(args[1].value);
    int min = std::min(n1, n2);
    int max = std::max(n1, n2);
    int result = min + (std::rand() % (max - min + 1));
    return IntNumber(result);
  } catch (const std::exception &error) {
    return handleError(env, "random");
  }
}

Obj randInt(Env &env, const std::vector<Obj> &args) {
  try {
    // Extract integers from the objects
    int n1 = std::any_cast<int>(args[0].value);
    int n2 = std::any_cast<int>(args[1].value);

    // Determine the minimum and maximum values
    int min = std::min(n1, n2);
    int max = std::max(n1, n2);

    // Ensure that min <= max
    if (min > max) {
      throw std::runtime_error("Invalid range: min is greater than max.");
    }

    // Generate a random integer within the range [min, max]
    int result = min + std::rand() % (max - min + 1);

    // Return the result wrapped in an IntNumber object
    return IntNumber(result);
  } catch (const std::exception &error) {
    // Handle errors by returning an appropriate ErrorObj
    return handleError(env, "randInt");
  }
}

Obj andFunc(Env &env, const std::vector<Obj> &objs) {
  try {
    for (const auto &obj : objs) {
      if (isTsLispFalse(obj)) {
        return TsLispInnerFalse;
      }
    }
    return TsLispInnerTrue;
  } catch (const std::exception &error) {
    return handleError(env, "and");
  }
}

Obj orFunc(Env &env, const std::vector<Obj> &objs) {
  try {
    for (const auto &obj : objs) {
      if (!isTsLispFalse(obj)) {
        return TsLispInnerTrue;
      }
    }
    return TsLispInnerFalse;
  } catch (const std::exception &error) {
    return handleError(env, "or");
  }
}

Obj evalExit(Env &env, const std::vector<Obj> &objs) { return None_Obj; }

// 评估过程值
Obj evalProcedureValue(Env &bodyEnv, const std::vector<Expr> &argNames,
                       const std::vector<Expr> &body,
                       const std::vector<Obj> &args) {
  try {
    if (args.size() != argNames.size()) {
      std::cerr << "Error: Invalid number of arguments" << std::endl;
      return handleError(bodyEnv, "evalProcedureValue");
    }

    Env workingEnv;
    // 假设 Env 有一个合适的拷贝构造函数
    workingEnv = bodyEnv;
    workingEnv.functionDepth = bodyEnv.functionDepth + 1;

    for (size_t i = 0; i < argNames.size(); ++i) {
      const Expr &argName = argNames[i];
      if ((argName.value).type() != typeid(string)) {
        workingEnv.set(std::any_cast<std::string>(argName.value), args[i]);
      } else {
        std::cerr << "Error: Invalid argument name type" << std::endl;
        return handleError(bodyEnv, "evalProcedureValue");
      }
    }

    Obj result = None_Obj;
    int funcDepth = workingEnv.functionDepth;
    for (const auto &expr : body) {
      result = evalExpr(workingEnv, expr);
      if (workingEnv.functionDepth < funcDepth) {
        return result;
      }
    }
    return result;
  } catch (const std::exception &error) {
    return handleError(bodyEnv, "evalProcedureValue");
  }
}

//!

// 假设 `builtinVars` 是一个静态的 map，存储了预定义的布尔值
const std::map<std::string, Obj> builtinVars = {{"#t", TsLispInnerTrue},
                                                {"#f", TsLispInnerFalse}};

// 将 expr 的值转化为环境中的键
Obj atomAsEnvKey(const Expr &expr) {
  return Obj(expr.value); // 假设 Obj 可以直接构造
}

Obj forFunc(Env &env, const std::vector<Expr> &body) {
  try {
    if (body.size() < 5) {
      throw std::runtime_error(
          "Insufficient number of arguments for 'for' loop.");
    }

    const Expr &condExpr = body[2];
    const Expr &updateExpr = body[3];

    Env workingEnv;
    for (const auto &pair : env) {
      workingEnv.set(pair.first, pair.second);
    }

    workingEnv.functionDepth = env.functionDepth + 1;

    Obj result = None_Obj;
    size_t funcDepth = workingEnv.functionDepth;
    size_t upperBound = body.size() - 1; // The index of the last element

    for (size_t i = 1; i < body.size(); ++i) {
      if (i == 1) {
        result = evalExpr(workingEnv, body[i]);
      } else if (i == 2) {
        result = evalExpr(workingEnv, body[i]);
        if (isTsLispFalse(result)) {
          i = upperBound; // Exit loop
        }
      } else if (i == 3) {
        // No action needed for index 3
      } else if (i == upperBound) {
        result = evalExpr(workingEnv, body[i]);
        if (!isTsLispFalse(evalExpr(workingEnv, condExpr))) {
          evalExpr(workingEnv, updateExpr);
          i = 3; // Reset to update expression
        } else {
          break; // Exit loop if condition is false
        }
      } else {
        result = evalExpr(workingEnv, body[i]);
      }

      if (workingEnv.functionDepth < funcDepth) {
        return result; // Exit if function depth changed
      }
    }

    return result;
  } catch (const std::exception &error) {
    return handleError(env, "for");
  }
}

bool isValidVariableName(const std::string &name) {
  // Example of C keywords or built-in options
  const std::unordered_set<std::string> builtinOpts = {
      "int", "float", "double", "char", "void" // Add more keywords if needed
  };

  // Check if it's a C keyword
  if (builtinOpts.find(name) != builtinOpts.end()) {
    return false;
  }

  // Check if the first character is valid
  if (name.empty() || !isalpha(name[0]) && name[0] != '_') {
    return false;
  }

  // Check remaining characters
  for (char ch : name) {
    if (!isalnum(ch) && ch != '_') {
      return false;
    }
  }

  return true;
}

// 定义变量
Obj defineVar(Env &env, const std::vector<Expr> &exprList) {
  try {
    std::string varName = std::any_cast<std::string>(
        atomAsEnvKey(exprList[1]).value); // 假设 Obj 直接转换为 string
    Obj varValue = evalExpr(env, exprList[2]);

    isValidVariableName(varName);

    env.set(varName, varValue);
    return varValue;
  } catch (const std::exception &error) {
    return handleError(env, "defineVar");
  }
}

// if 函数实现
Obj ifFunc(Env &env, const std::vector<Expr> &exprList) {
  try {
    Obj condition = evalExpr(env, exprList[1]);
    if (isTsLispFalse(condition)) {
      if (exprList.size() == 4)
        return evalExpr(env, exprList[3]);
      else
        return Obj(0); // 假设 Obj 构造函数可以接受整数值
    } else {
      return evalExpr(env, exprList[2]);
    }
  } catch (const std::exception &error) {
    return handleError(env, "if");
  }
}

// while 函数实现
Obj whileFunc(Env &env, const std::vector<Expr> &exprList) {
  try {
    Obj condition = evalExpr(env, exprList[1]);
    Obj result = None_Obj;

    while (!isTsLispFalse(condition)) {
      for (size_t i = 2; i < exprList.size() - 1; ++i) {
        evalExpr(env, exprList[i]);
      }
      result = evalExpr(env, exprList.back());
      condition = evalExpr(env, exprList[1]);
    }
    return result;
  } catch (const std::exception &error) {
    return handleError(env, "while");
  }
}

Obj lambdaObj(Env &env, const std::vector<Expr> &exprList) {
  std::vector<Expr> modifiedExprList = exprList;
  modifiedExprList.erase(modifiedExprList.begin()); // Remove 'lambda' keyword
  std::vector<Expr> argNames = std::any_cast<vector<Expr>>(
      modifiedExprList[0].value); // Extract argument names
  std::vector<Expr> body = std::vector<Expr>(
      modifiedExprList.begin() + 1, modifiedExprList.end()); // Extract body

  std::string functionString = "(";
  for (size_t i = 0; i < argNames.size(); ++i) {
    if (i > 0)
      functionString += ", ";
    functionString += std::any_cast<string>(argNames[i].value);
  }
  functionString += ")";

  std::string lambdaString = "function" + functionString;

  Lambda_Procedure func("LambdaObj", lambdaString, argNames, body);

  return func;
}

Obj evalLambdaObj(Env &env, const Procedure &opt,
                  const std::vector<Expr> &exprList) {
  std::vector<Obj> parameters;
  for (size_t i = 1; i < exprList.size(); ++i) {
    parameters.push_back(evalExpr(env, exprList[i]));
  }
  if (typeid(opt) == typeid(Lambda_Procedure)) {
    const Lambda_Procedure &lambdaProc =
        dynamic_cast<const Lambda_Procedure &>(opt);
    return evalProcedureValue(env, lambdaProc.argNames,
                              std::any_cast<std::vector<Expr>>(lambdaProc.body),
                              parameters);
  } else {
    return handleError(env, "invalid use of procedure");
  }
}

Obj _displayFuncDepth(Env &env, const std::vector<Expr> &exprList) {
  return IntNumber(env.functionDepth);
}

std::unordered_map<std::string,
                   std::function<Obj(Env &, const std::vector<Obj> &)>>
    objOpts = {
        {"+", addObjs},
        {"-", subObjs},
        {"*", mulObjs},
        {"**", powerObjs},
        {"/", divObjs},
        {">", gtObjs},
        {"<", ltObjs},
        {">=", geObjs},
        {"<=", leObjs},
        {"==", eqObjs},
        {"abs", absObj},
        {"display", display},
        {"begin", begin},
        {"list", listObj},
        {"get", getFromContainer},
        {"set", setContainer},
        {"push", pushIntoContainer},
        {"dict", dictObj},
        {"str", makeStr},
        {"random", randomFunc},
        {"randInt", randInt},
        {"return", returnFunc},
        {"and", andFunc},
        {"or", orFunc},
        {"exit", evalExit},
};

std::unordered_map<std::string,
                   std::function<Obj(Env &, const std::vector<Expr> &)>>
    exprLiteralOpts = {
        {"=", defineVar},      {"define", defineVar},
        {"lambda", lambdaObj}, {"if", ifFunc},
        {"while", whileFunc},  {"_displayFuncDepth", _displayFuncDepth},
        {"for", forFunc}};

Obj evalExpr(Env &env, const Expr &expr) {
  Obj result = Obj();

  if (expr.type == ExprType::ATOM) {
    result = evalAtom(env, expr);
  } else if (expr.type == ExprType::STRING_EXPR) {
    result = evalStringExpr(expr);
  } else {
    result = evalListExpr(env, expr);
  }

  if (!env.hasFailed) {
    return result;
  } else {
    ErrorObj obj(env.errorMessage);
    env.cleanup();
    return obj;
  }
}

Obj evalStringExpr(const Expr &expr) {
  return String_Obj(TCast<string>(expr.value));
}

// evalListExpr 是运行时的主要性能消耗
Obj evalListExpr(Env &env, const Expr &expr) {
  const std::vector<Expr> &exprList = TCast<vector<Expr>>(expr.value);
  const Expr &firstExpr = exprList[0]; // 获取表达式的第一个元素

  try {
    Procedure opt;
    if (firstExpr.type == ExprType::ATOM) {
      opt = static_cast<Procedure>(evalAtom(env, firstExpr));
    } else {
      opt = static_cast<Procedure>(evalListExpr(env, firstExpr));
    }

    string key = TCast<Procedure>(opt).value;
    Obj result;
    if (key == "LambdaObj") {
      result = evalLambdaObj(env, opt, exprList);
      if (TCast<ErrorObj>(result)) {
        return ErrorObj(TCast<string>(result.value));
      } else {
        return result;
      }
    } else if (auto keys = extractKeys(exprLiteralOpts);
               keys.find(key) != keys.end()) {
      result = exprLiteralOpts[key](env, exprList);
      if (TCast<ErrorObj>(result)) {
        return ErrorObj(TCast<string>(result.value));
      } else {
        return result;
      }
    } else {
      std::vector<Obj> parameters;
      for (size_t i = 1; i < exprList.size(); ++i) {
        parameters.push_back(evalExpr(env, exprList[i]));
      }

      Obj result = objOpts[key](env, parameters); // 调用函数并传递参数

      if (TCast<ErrorObj>(result)) {
        return ErrorObj(TCast<std::string>(result.value));
      } else {
        return result;
      }
    }
  } catch (const std::exception &e) {
    std::cerr << "An error occurred: " << e.what() << std::endl;
    throw;
  }
}

Obj evalAtom(Env &env, const Expr &expr) {
  try {
    const std::string &literal = TCast<string>(expr.value);

    if (isInt(literal)) {
      return IntNumber(std::stoi(literal));
    } else if (isFloat(literal)) {
      return FloatNumber(std::stof(literal));
    } else {
      return String_Obj(TCast<string>(env.get(literal)));
    }
  } catch (...) {
    env.setErrorMessage("Invalid use of " + TCast<string>(expr.value));
    return ErrorObj("");
  }
}

Obj getFromEnv(Env env, string literal) {
  try {
    auto value = env.get(literal);
    if (!TCast<void *>(value).value) {
      return Obj(literal);
    }
    return value;
  } catch (...) {
    return handleError(env, literal + "not found in env");
  }
}

bool isInt(const std::string &s) {
  try {
    std::stoi(s);
    return true;
  } catch (...) {
    return false;
  }
}

bool isFloat(const std::string &s) {
  try {
    std::stof(s);
    return true;
  } catch (...) {
    return false;
  }
}

#endif // BUILTIN_H
