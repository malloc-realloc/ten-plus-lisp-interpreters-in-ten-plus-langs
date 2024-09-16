import {
  Obj,
  IntNumber,
  FloatNumber,
  Bool,
  TRUE,
  FALSE,
  None_Obj,
  ExprObj,
  ObjType,
  String_Obj,
  List_Obj,
  Dict_Obj,
  Lambda_Procedure,
  Procedure,
  Class_Obj,
  Undefined_Obj,
  createMultiDimArray,
  ArrayObj,
  AIObj,
} from "./obj";
import { Env } from "./env";
import { Atom, Expr, ExprType } from "./ast";
import { evalExpr, evalExprs } from "./eval";
import { handleError } from "./commons";
import { Instance_Obj } from "./obj";
import { error } from "console";
import { tokenize } from "./token";
import { parseExprs } from "./parser";
import { readFile, readFileSync } from "fs";
import exp from "constants";

type Number = IntNumber | FloatNumber;

type NumberOrString = Number | String_Obj;

const TsLispInnerFalse = new IntNumber(0);
const TsLispInnerTrue = new IntNumber(1);

function isTsLispFalse(obj: Obj): Boolean {
  return (
    obj === FALSE ||
    obj === None_Obj ||
    (typeof obj.value === "number" && obj.value === 0)
  );
}

export function addObjs(env: Env, ...args: Obj[]): Obj {
  try {
    if (args.length === 0) {
      throw handleError(env, "At least one argument is required");
    }

    if (typeof args[0].value === "string") {
      let result = "";
      for (let arg of args) {
        if (arg.name === "ErrorObj") {
          return handleError(env, "+");
        } else {
          result += arg.value;
        }
      }
      return new String_Obj(result);
    } else if (typeof args[0].value === "number") {
      let result = 0;
      for (let arg of args) {
        if (Number.isInteger(arg.value)) {
          result += arg.value;
        } else {
          return handleError(
            env,
            "+ cannot be applied to objects with type except number, string"
          );
        }
      }
      return Number.isInteger(result)
        ? new IntNumber(result)
        : new FloatNumber(result);
    }
  } catch (error) {
    return handleError(env, "+");
  }

  return handleError(env, "+");
}

export function subObjs(env: Env, ...args: NumberOrString[]): Obj {
  try {
    if (args.length === 0) {
      throw handleError(env, "At least one argument is required");
    }

    if (typeof args[0].value === "string") {
      return handleError(env, "- cannot be applied to strings");
    }

    let result = args[0].value;
    for (const arg of args.slice(1)) {
      if (typeof arg.value === "string") {
        return handleError(env, "- cannot be applied to strings");
      }
      if (Number.isInteger(arg.value)) {
        result -= arg.value;
      } else {
        return handleError(env, "- can only be applied to integer numbers");
      }
    }
    return Number.isInteger(result)
      ? new IntNumber(result)
      : new FloatNumber(result);
  } catch (error) {
    return handleError(env, "-");
  }
}

export function powerObjs(env: Env, ...args: NumberOrString[]): Obj {
  try {
    if (args.length !== 2) {
      throw handleError(env, "Exactly two arguments are required for **");
    }

    if (
      typeof args[0].value === "string" ||
      typeof args[1].value === "string"
    ) {
      return handleError(env, "** cannot be applied to strings");
    }

    let result = args[0].value ** args[1].value;
    return Number.isInteger(result)
      ? new IntNumber(result)
      : new FloatNumber(result);
  } catch (error) {
    return handleError(env, "**");
  }
}

export function mulObjs(env: Env, ...args: NumberOrString[]): Obj {
  try {
    if (args.length === 0) {
      throw handleError(env, "At least one argument is required");
    }

    let result = 1;
    for (const arg of args) {
      if (typeof arg.value === "string") {
        return handleError(env, "* cannot be applied to strings");
      }
      result *= arg.value;
    }
    return Number.isInteger(result)
      ? new IntNumber(result)
      : new FloatNumber(result);
  } catch (error) {
    return handleError(env, "*");
  }
}

export function makeStr(env: Env, ...objs: Obj[]): Obj {
  try {
    if (objs.length === 0) {
      throw handleError(env, "At least one argument is required");
    }

    let s: string = "";
    for (let i = 1; i < objs.length; i++) {
      s += String(objs[i].value);
      s += String(objs[0].value);
    }
    return new String_Obj(s.slice(0, -1));
  } catch (error) {
    return handleError(env, "str");
  }
}

export function divObjs(env: Env, ...args: NumberOrString[]): Obj {
  try {
    if (args.length < 2) {
      throw handleError(env, "At least two arguments are required");
    }

    if (typeof args[0].value === "string") {
      return handleError(env, "/ cannot be applied to strings");
    }

    let result = args[0].value;
    for (const arg of args.slice(1)) {
      if (typeof arg.value === "string") {
        return handleError(env, "/ cannot be applied to strings");
      }
      if (arg.value === 0) {
        throw handleError(env, "Division by zero");
      }
      result /= arg.value;
    }
    return Number.isInteger(result)
      ? new IntNumber(result)
      : new FloatNumber(result);
  } catch (error) {
    return handleError(env, "/");
  }
}

export function listObj(env: Env, ...args: Obj[]): Obj {
  try {
    let obj = new List_Obj([]);
    for (const arg of args) {
      obj.value.push(arg);
    }
    return obj;
  } catch (error) {
    return handleError(env, "list");
  }
}

export function concatFunc(env: Env, ...args: Obj[]): Obj {
  try {
    let obj: List_Obj = new List_Obj(new Array<Obj>(), ObjType.LIST_OBJ);
    for (let i = 0; i < args.length; i++) {
      obj.value = obj.value.concat(args[i].value as Array<Obj>);
    }
    return obj;
  } catch (error) {
    return handleError(env, "concat");
  }
}

function saveRegex(pattern: string, flags: string = ""): RegExp {
  return new RegExp(pattern, flags);
}

export function macroFunc(env: Env, ...args: Obj[]): Obj {
  try {
    env.macros.push([saveRegex(args[0].value), args[1].value]);
    return None_Obj;
  } catch (error) {
    return handleError(env, "macro");
  }
}

function formatString(template: string, ...args: string[]): string {
  return template.replace(/\$(\d+)/g, (match, index) => {
    const argIndex = parseInt(index, 10);
    return argIndex < args.length ? args[argIndex] : match;
  });
}

export function importFunc(env: Env, ...args: Obj[]): Obj {
  try {
    let obj: Obj = None_Obj;
    for (let i = 0; i < args.length; i++) {
      const fileContent: string = readFileSync(args[i].value, "utf-8");
      obj = evalExprs(env, parseExprs(tokenize(env, fileContent)));
    }
    return obj;
  } catch (error) {
    return handleError(env, "import error: failed to open the file");
  }
}

export function mapFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const lst: List_Obj = args[0] as List_Obj;
    const opt: Lambda_Procedure = args[1] as Lambda_Procedure;
    let result: List_Obj = new List_Obj(new Array<Obj>());
    for (let i = 0; i < (lst.value as Array<Obj>).length; i++) {
      result.value.push(
        evalProcedureValue(
          opt.env,
          opt.argNames,
          opt.body as Expr[],
          lst.value[i]
        )
      );
    }
    return result;
  } catch (error) {
    return handleError(env, "map");
  }
}

export function formatFunc(env: Env, ...args: Obj[]): Obj {
  try {
    let stringArgs: string[] = [];
    for (let i = 1; i < args.length; i++) {
      stringArgs.push(args[i].value);
    }

    const s = formatString(args[0].value, ...stringArgs);
    return new String_Obj(s);
  } catch (error) {
    return handleError(env, "format");
  }
}

export function dictObj(env: Env, ...args: Obj[]): Obj {
  try {
    let obj = new Dict_Obj({});
    for (const [index, value] of args.entries()) {
      if (index % 2 === 0) {
        if (typeof args[index].value !== "string") {
          throw handleError(env, "key must be string");
        }
        obj.value[args[index].value] = args[index + 1];
      } else {
        continue;
      }
    }
    return obj;
  } catch (error) {
    return handleError(env, "dict");
  }
}

export function gtObjs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value > arg2.value ? TRUE : FALSE;
  } catch (error) {
    return handleError(env, ">");
  }
}

export function ltObjs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value < arg2.value ? TRUE : FALSE;
  } catch (error) {
    return handleError(env, "<");
  }
}

export function geObjs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value >= arg2.value ? TRUE : FALSE;
  } catch (error) {
    return handleError(env, ">=");
  }
}

export function leObjs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value <= arg2.value ? TRUE : FALSE;
  } catch (error) {
    return handleError(env, "<=");
  }
}

export function eqObjs(env: Env, arg1: Obj, arg2: Obj): Obj {
  try {
    return arg1.value === arg2.value ? TRUE : FALSE;
  } catch (error) {
    return handleError(env, "=");
  }
}

export function absObj(env: Env, arg: Number): Obj {
  try {
    const result = Math.abs(arg.value);
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    return handleError(env, "abs");
  }
}

export function evalExprObj(env: Env, expr: ExprObj): Obj {
  try {
    return evalExpr(env, expr.value);
  } catch (error) {
    return handleError(env, "eval");
  }
}

export function display(env: Env, ...args: Obj[]): Obj {
  try {
    if (
      typeof args[0].value.literal === "string" ||
      typeof args[0].value.literal === "string"
    ) {
      for (const arg of args) {
        console.log(arg.value.literal);
      }
    } else {
      for (const arg of args) {
        console.log(arg.value);
      }
    }
    return args[args.length - 1];
  } catch (error) {
    return handleError(env, "display");
  }
}

export function begin(env: Env, ...args: Obj[]): Obj {
  try {
    return args[args.length - 1];
  } catch (error) {
    return handleError(env, "begin");
  }
}

export function cdr(env: Env, exprObj: ExprObj): Obj {
  try {
    return new ExprObj(
      new Expr(ExprType.LST_EXPR, exprObj.value.value.slice(1))
    );
  } catch (error) {
    return handleError(env, "cdr");
  }
}

export function car(env: Env, exprObj: ExprObj): Obj {
  try {
    if (exprObj.value.type === ExprType.ATOM) {
      return exprObj;
    } else {
      if (exprObj.value.value[0].type === ExprType.ATOM) {
        return new ExprObj(
          new Expr(ExprType.ATOM, exprObj.value.value[0].value)
        );
      } else {
        return new ExprObj(
          new Expr(ExprType.LST_EXPR, exprObj.value.value[0].value)
        );
      }
    }
  } catch (error) {
    return handleError(env, "car");
  }
}

export function cons(env: Env, obj0: ExprObj, obj1: ExprObj): Obj {
  try {
    if (obj1.value.type === ExprType.LST_EXPR) {
      const newObj = structuredClone(obj1.value.value);
      newObj.unshift(new Expr(obj0.value.type, obj0.value.value));

      let ExprObjValueValue = [obj0.value];
      if (obj1.value.type == ExprType.ATOM) {
        ExprObjValueValue.push(obj1.value);
      } else {
        for (let i = 0; i < obj1.value.value.length; i++) {
          ExprObjValueValue.push(obj1.value.value[i]);
        }
      }
      return new ExprObj(new Expr(ExprType.LST_EXPR, ExprObjValueValue));
    } else {
      return new ExprObj(
        new Expr(ExprType.LST_EXPR, [
          new Expr(obj0.value.type, obj0.value.value),
          obj1.value.value,
        ])
      );
    }
  } catch (error) {
    return handleError(env, "cons");
  }
}

export function defineClass(
  env: Env,
  className: Undefined_Obj,
  ...args: String_Obj[]
): Obj {
  let classProperties = new Map<string, Obj>();

  for (let arg of args) {
    classProperties.set(arg.value, None_Obj);
  }

  env.classes.set(className.value as string, classProperties);

  env.set(className.value, new Class_Obj(className.value));

  return None_Obj;
}

export function defineSubClass(
  env: Env,
  fatherClassName: Class_Obj,
  ...args: Undefined_Obj[]
): Obj {
  let classProperties: Map<string, Obj> = env.classes.get(
    fatherClassName.value as string
  ) as Map<string, Obj>;
  const subclassName: string = args[0].value as string;

  for (let i = 0; i < args.length; i++) {
    classProperties.set(args[i].value, None_Obj);
  }

  env.classes.set(subclassName, classProperties);

  env.set(subclassName, new Class_Obj(subclassName));

  return None_Obj;
}

export function getFromContainer(
  env: Env,
  obj1: List_Obj | Dict_Obj,
  obj0: IntNumber | String_Obj
): Obj {
  try {
    if (obj1.type === ObjType.LIST_OBJ) {
      if (obj0.value < 0) {
        throw handleError(env, "index must be positive");
      }
      if (obj1.value.length <= obj0.value) {
        throw handleError(
          env,
          `index ${obj0.value} must be smaller than length of list ${obj1.value.length}`
        );
      }
      return obj1.value[obj0.value];
    } else if (obj1.type === ObjType.DICT_OBJ) {
      if (obj1.value.hasOwnProperty(obj0.value)) {
        return obj1.value[obj0.value];
      } else {
        throw handleError(env, `key ${obj0.value} not found in dictionary`);
      }
    }
    throw handleError(env, "Invalid usage of get");
  } catch (error) {
    return handleError(env, "get");
  }
}

export function setContainer(
  env: Env,
  obj1: List_Obj | Dict_Obj,
  obj0: IntNumber | String_Obj,
  value: Obj
): Obj {
  try {
    if (obj1.type === ObjType.LIST_OBJ) {
      if (obj0.value < 0) {
        throw handleError(env, "index must be positive");
      }
      if (obj1.value.length <= obj0.value) {
        throw handleError(
          env,
          `index ${obj0.value} must be smaller than length of list ${obj1.value.length}`
        );
      }
      obj1.value[obj0.value] = value;
      return value;
    } else {
      if (obj1.value.hasOwnProperty(obj0.value)) {
        obj1.value[obj0.value] = value;
        return value;
      } else {
        throw handleError(env, `key ${obj0.value} not found in dictionary`);
      }
    }
  } catch (error) {
    return handleError(env, "set");
  }
}

export function pushIntoContainer(env: Env, obj1: List_Obj, value: Obj): Obj {
  try {
    obj1.value.push(value);
    return value;
  } catch (error) {
    return handleError(env, "push");
  }
}

export function arrayFunc(env: Env, ...args: IntNumber[]): Obj {
  try {
    return new ArrayObj(createMultiDimArray(args.map((arg) => arg.value)));
  } catch (error) {
    return handleError(env, "array");
  }
}

export function setArrFunc(
  env: Env,
  obj: Obj,
  arrObj: ArrayObj,
  ...NumberIndexes: Number[]
): Obj {
  try {
    const indexes: number[] = NumberIndexes.map((i) => i.value);
    let arr = arrObj.value;

    if (indexes.length === 1) {
      arr[indexes[0]] = obj;
    }

    for (let i = 0; i < indexes.length - 1; i++) {
      const index = indexes[i];

      // Check if the index is within bounds
      if (!Array.isArray(arr) || index >= arr.length) {
        throw handleError(env, `Index ${index} out of bounds.`);
      }

      if (i === indexes.length - 2) {
        arr[index][indexes[indexes.length - 1]] = obj;
      } else {
        arr = arr[index];
      }
    }
    return obj;
  } catch (error) {
    return handleError(env, "setArr");
  }
}

export function getArrFunc(
  env: Env,
  arrObj: ArrayObj,
  ...NumberIndexes: Number[]
): Obj {
  try {
    const indexes: number[] = NumberIndexes.map((i) => i.value);
    let arr = arrObj.value;

    if (indexes.length === 1) {
      return arr[indexes[0]];
    }

    for (let i = 0; i < indexes.length - 1; i++) {
      const index = indexes[i];

      // Check if the index is within bounds
      if (!Array.isArray(arr) || index >= arr.length) {
        throw handleError(env, `Index ${index} out of bounds.`);
      }

      if (i === indexes.length - 2) {
        return arr[index][indexes[indexes.length - 1]];
      } else {
        arr = arr[index];
      }
    }
    throw error;
  } catch (error) {
    return handleError(env, "getArr");
  }
}

export function callLLM(env: Env, ...args: Obj[]): Obj {
  try {
    let returnValue = "";
    for (let i = 0; i < args.length; i++) {
      returnValue += (args[i].value + " ") as string;
    }

    return new AIObj(returnValue);
  } catch (error) {
    return handleError(env, "call large language model.");
  }
}

export function randomFunc(env: Env, arg1: Obj, arg2: Obj): Obj {
  try {
    const n1 = arg1.value;
    const n2 = arg2.value;
    const min = Math.min(n1, n2);
    const max = Math.max(n1, n2);
    const result = new IntNumber(Math.random() * (max - min) + min);
    return result;
  } catch (error) {
    return handleError(env, "random");
  }
}

export function randInt(env: Env, arg1: Obj, arg2: Obj): Obj {
  try {
    const n1 = arg1.value;
    const n2 = arg2.value;
    const min = Math.floor(Math.min(n1, n2));
    const max = Math.ceil(Math.max(n1, n2));
    const result = new IntNumber(
      Math.floor(Math.random() * (max - min + 1) + min)
    );
    return result;
  } catch (error) {
    return handleError(env, "randInt");
  }
}

export function randChoice(env: Env, ...args: Obj[]): Obj {
  try {
    const l = args.length;
    const i = Math.floor(Math.random() * l);
    return args[i];
  } catch (error) {
    return handleError(env, "randChoice");
  }
}

export function returnFunc(env: Env, arg: Obj): Obj {
  try {
    env.functionDepth--;
    return arg;
  } catch (error) {
    return handleError(env, "return");
  }
}

export function getItem(
  env: Env,
  instanceObj: Instance_Obj,
  name: Undefined_Obj
): Obj {
  try {
    const obj = instanceObj.value.get(name.value);

    return obj;
  } catch (error) {
    return handleError(env, "return");
  }
}

export function setMethod(
  env: Env,
  classObj: Class_Obj,
  name: Undefined_Obj,
  procedure: Procedure
): Obj {
  try {
    env.classes.get(classObj.value)?.set(name.value, procedure);

    return procedure;
  } catch (error) {
    return None_Obj;
  }
}

export function plusPlusFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const obj: Obj | undefined = env.get(exprList[1].value as string);
    if (obj === undefined) return handleError(env, "++: invalid variable name");
    obj.value++;
    env.set(exprList[1].value as string, obj);

    if (obj instanceof IntNumber) {
      return new IntNumber(obj.value - 1);
    } else if (obj instanceof FloatNumber) {
      return new FloatNumber(obj.value - 1);
    } else {
      return handleError(env, "++ can only be applied on number");
    }
  } catch (error) {
    return handleError(env, "++");
  }
}

export function minusMinusFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const obj: Obj | undefined = env.get(exprList[1].value as string);
    if (obj === undefined) return handleError(env, "--: invalid variable name");
    obj.value--;
    env.set(exprList[1].value as string, obj);

    if (obj instanceof IntNumber) {
      return new IntNumber(obj.value + 1);
    } else if (obj instanceof FloatNumber) {
      return new FloatNumber(obj.value + 1);
    } else {
      return handleError(env, "-- can only be applied on number");
    }
  } catch (error) {
    return handleError(env, "--");
  }
}

export function plusEqualFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const obj: Obj | undefined = env.get(exprList[1].value as string);
    if (obj === undefined) return handleError(env, "+=: invalid variable name");
    const val = evalExpr(env, exprList[2]);
    obj.value += val.value;
    env.set(exprList[1].value as string, obj);

    if (obj instanceof IntNumber) {
      return new IntNumber(obj.value);
    } else if (obj instanceof FloatNumber) {
      return new FloatNumber(obj.value);
    } else {
      return handleError(env, "+= can only be applied on number");
    }
  } catch (error) {
    return handleError(env, "+=");
  }
}

export function minusEqualFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const obj: Obj | undefined = env.get(exprList[1].value as string);
    if (obj === undefined) return handleError(env, "-=: invalid variable name");
    const val = evalExpr(env, exprList[2]);
    obj.value -= val.value;
    env.set(exprList[1].value as string, obj);

    if (obj instanceof IntNumber) {
      return new IntNumber(obj.value);
    } else if (obj instanceof FloatNumber) {
      return new FloatNumber(obj.value);
    } else {
      return handleError(env, "-= can only be applied on number");
    }
  } catch (error) {
    return handleError(env, "-=");
  }
}

export function colonColonFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const fatherFunc: Lambda_Procedure = evalExpr(
      env,
      exprList[1]
    ) as Lambda_Procedure;
    return evalExpr(fatherFunc.env, exprList[2]);
  } catch (error) {
    return handleError(env, "::");
  }
}

export function mulEqualFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const obj: Obj | undefined = env.get(exprList[1].value as string);
    if (obj === undefined) return handleError(env, "*=: invalid variable name");
    const val = evalExpr(env, exprList[2]);
    obj.value *= val.value;
    env.set(exprList[1].value as string, obj);

    if (obj instanceof IntNumber) {
      return new IntNumber(obj.value);
    } else if (obj instanceof FloatNumber) {
      return new FloatNumber(obj.value);
    } else {
      return handleError(env, "*= can only be applied on number");
    }
  } catch (error) {
    return handleError(env, "*=");
  }
}

export function divEqualFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const obj: Obj | undefined = env.get(exprList[1].value as string);
    if (obj === undefined) return handleError(env, "/=: invalid variable name");
    const val = evalExpr(env, exprList[2]);
    if (val.value === 0) {
      return handleError(env, "can not divide by 0");
    }
    obj.value /= val.value;
    env.set(exprList[1].value as string, obj);

    if (obj instanceof IntNumber) {
      return new IntNumber(obj.value);
    } else if (obj instanceof FloatNumber) {
      return new FloatNumber(obj.value);
    } else {
      return handleError(env, "/= can only be applied on number");
    }
  } catch (error) {
    return handleError(env, "/=");
  }
}

export function switchFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const key = evalExpr(env, exprList[1]);
    for (let i = 2; i < exprList.length; i++) {
      const caseKey = evalExpr(env, exprList[i].value[0] as Expr);
      if (caseKey.value === key.value) {
        const obj = evalExprs(env, (exprList[i].value as Expr[]).slice(1));
        return obj;
      }
    }

    return None_Obj;
  } catch (error) {
    return handleError(env, "switch");
  }
}

export function letFunc(env: Env, exprList: Expr[]): Obj {
  try {
    let newEnv = new Env();
    newEnv.fatherEnv = env;
    const obj = evalExprs(newEnv, exprList.slice(1));

    return obj;
  } catch (error) {
    return handleError(env, "let");
  }
}

export function call_method(env: Env, exprList: Expr[]): Obj {
  try {
    const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));

    const instance = parameters[0] as Instance_Obj;
    const methodName = parameters[1] as String_Obj;

    env.newThis(instance.instanceName, instance);

    const procedure: Procedure = env.classes
      .get(instance.className)
      ?.get(methodName.value) as Procedure;

    const obj: Obj = evalLambdaObj(env, procedure, exprList.slice(2));

    env.popThis();

    return obj;
  } catch (error) {
    return handleError(env, "call_method");
  }
}

function andFunc(env: Env, ...objs: Obj[]): Obj {
  try {
    for (let obj of objs) {
      if (isTsLispFalse(obj)) return TsLispInnerFalse;
    }
    return TsLispInnerTrue;
  } catch (error) {
    return handleError(env, "and");
  }
}

function orFunc(env: Env, ...objs: Obj[]): Obj {
  try {
    for (let obj of objs) {
      if (!isTsLispFalse(obj)) return TsLispInnerTrue;
    }
    return TsLispInnerFalse;
  } catch (error) {
    return handleError(env, "or");
  }
}

export function defineClassInstance(
  env: Env,
  classObj: Class_Obj,
  name: Undefined_Obj
): Obj {
  try {
    const instance = new Instance_Obj(
      env.classes.get(classObj.value) as Map<string, Obj>,
      name.value,
      classObj.value
    );
    env.set(name.value, instance);

    return instance;
  } catch (error) {
    return handleError(env, "instance");
  }
}

export function setItem(
  env: Env,
  instanceObj: Instance_Obj,
  name: Undefined_Obj,
  obj: Obj
): Obj {
  try {
    instanceObj.value.set(name.value, obj);

    return obj;
  } catch (error) {
    return handleError(env, "setItem");
  }
}

export const builtinVars: { [key: string]: Bool } = {
  "#t": TRUE,
  "#f": FALSE,
};

function quote(env: Env, exprList: Expr[]): Obj {
  /* This is where Expr becomes ExprObj, enabling eval to eval quote. */
  try {
    if (exprList.length === 2 && exprList[1].type === ExprType.ATOM) {
      return new ExprObj(new Expr(ExprType.ATOM, exprList[1].value));
    } else {
      return new ExprObj(new Expr(ExprType.LST_EXPR, exprList.slice(1)));
    }
  } catch (error) {
    return handleError(env, "quote");
  }
}

function bind(env: Env, exprList: Expr[]): Obj {
  try {
    const var_name = exprList[1].value;
    const func_name = "_update_" + var_name;
    const body = exprList.slice(1).slice(1);
    const lambdaString = `function ${func_name}`;
    const expressions = new Lambda_Procedure(
      "LambdaObj",
      lambdaString,
      [] as Expr[],
      body
    );
    env.set(func_name, expressions);
    return expressions;
  } catch (error) {
    return handleError(env, "bind");
  }
}

function atomAsEnvKey(expr: Expr): Obj {
  try {
    return new Obj(expr.value);
  } catch (error) {
    return None_Obj;
  }
}

function forFunc(env: Env, body: Expr[]): Obj {
  try {
    const condExpr: Expr = body[2];
    const updateExpr: Expr = body[3];

    let workingEnv = new Env();
    for (let [key, value] of env) {
      if (value !== undefined) workingEnv.set(key, value);
    }

    if (body.length < 5) throw error;

    workingEnv.functionDepth = env.functionDepth + 1;

    let result: Obj = None_Obj;
    let funcDepth = workingEnv.functionDepth;
    for (let i = 1; i < body.length; i++) {
      switch (i) {
        case 1:
          result = evalExpr(workingEnv, body[i]);
          break;

        case 2:
          result = evalExpr(workingEnv, body[i]);
          if (isTsLispFalse(result)) {
            i = body.length - 1;
          }
          break;

        case 3:
          break;

        case body.length - 1:
          result = evalExpr(workingEnv, body[i]);
          if (!isTsLispFalse(evalExpr(workingEnv, body[2]))) {
            evalExpr(workingEnv, body[3]);
            i = 3;
          }
          break;

        default:
          result = evalExpr(workingEnv, body[i]);
          break;
      }

      if (workingEnv.functionDepth < funcDepth) {
        return result;
      }
    }

    return result;
  } catch (error) {
    return handleError(env, "for");
  }
}

function updateVar(env: Env, exprList: Expr[]): Obj {
  try {
    const objValue = evalExpr(env, exprList[2]);

    const whereIsVar = env.whereIsVar(exprList[1].value as Atom);

    if (whereIsVar) whereIsVar.set(exprList[1].value as Atom, objValue);
    else env.set(exprList[1].value as Atom, objValue);

    const procedure = env.get(
      `_update_${exprList[1].value}`
    ) as Lambda_Procedure;
    if (procedure !== undefined) {
      evalProcedureValue(env, [], procedure.body as Expr[]);
    }
    return objValue;
  } catch (error) {
    return handleError(env, "updateVar");
  }
}

function defineVar(env: Env, exprList: Expr[]): Obj {
  try {
    const varName = atomAsEnvKey(exprList[1]);
    const varValue = evalExpr(env, exprList[2]);

    isValidVariableName(varName.value);

    env.set(varName.value, varValue);
    return varValue;
  } catch (error) {
    return handleError(env, "defineVar");
  }
}

export function ifFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const condition: Obj = evalExpr(env, exprList[1]);
    if (isTsLispFalse(condition)) {
      if (exprList.length === 4) return evalExpr(env, exprList[3]);
      else return new IntNumber(0);
    } else {
      return evalExpr(env, exprList[2]);
    }
  } catch (error) {
    return handleError(env, "if");
  }
}

export function whileFunc(env: Env, exprList: Expr[]): Obj {
  try {
    let condition: Obj = evalExpr(env, exprList[1]);
    let result: Obj = None_Obj;
    while (
      !(condition === FALSE || condition === None_Obj || condition.value === 0)
    ) {
      for (let i = 2; i < exprList.length - 1; i++) {
        evalExpr(env, exprList[i]);
      }
      result = evalExpr(env, exprList[exprList.length - 1]);
      condition = evalExpr(env, exprList[1]);
    }
    return result;
  } catch (error) {
    return handleError(env, "while");
  }
}

function returnLambdaObj(env: Env, exprList: Expr[]): Obj {
  try {
    exprList = exprList.slice(1);
    let argNames = exprList[0].value as Expr[];
    let body = exprList.slice(1);

    const functionString = `(${argNames.map((arg) => arg.value).join(", ")})`;
    const lambdaString = `function${functionString}`;

    const func = new Lambda_Procedure(
      "LambdaObj",
      lambdaString,
      (argNames = argNames),
      (body = body),
      (env = env)
    );

    return func;
  } catch (error) {
    return handleError(env, "LambdaObj");
  }
}

export function evalLambdaObj(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
    const parameters: Obj[] = [];
    for (let i = 1; i < exprList.length; i++) {
      parameters.push(evalExpr(env, exprList[i]));
    }

    if (opt instanceof Lambda_Procedure) {
      return evalProcedureValue(
        opt.env,
        opt.argNames,
        opt.body as Expr[],
        ...parameters
      );
    } else {
      return handleError(env, "invalid use of procedure");
    }
  } catch (error) {
    return handleError(env, "evaluate lambda function");
  }
}

export function typeFunc(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
    return new String_Obj(opt.name);
  } catch (error) {
    return handleError(env, "type");
  }
}

function evalProcedureValue(
  env: Env,
  argNames: Expr[],
  body: Expr[],
  ...args: Obj[] // any[]
): Obj {
  try {
    if (args.length !== argNames.length) {
      console.error("Error: Invalid number of arguments");
    }

    const originalDepth = env.functionDepth;
    env.functionDepth = env.functionDepth + 1;

    argNames.forEach((argName, index) => {
      if (typeof argName.value === "string") {
        if (argName.value[0] == "*") {
          env.set(
            argName.value.slice(1, argName.value.length),
            args[index].copy()
          );
        } else {
          env.set(argName.value, args[index]);
        }
      } else {
        console.error(
          `Error: Invalid argument name type: ${typeof argName.value}`
        );
      }
    });

    let result: Obj = None_Obj;
    let funcDepth = env.functionDepth;
    for (let expr of body) {
      result = evalExpr(env, expr);
      if (originalDepth >= funcDepth) {
        return result;
      }
    }
    return result;
  } catch (error) {
    return handleError(env, "evalProcedureValue");
  }
}

function _displayFuncDepth(env: Env, exprList: Expr[]): Obj {
  return new IntNumber(env.functionDepth);
}

const exprLiteralOpts: { [key: string]: Function } = {
  quote: quote,
  bind: bind,
  update: updateVar,
  define: defineVar,
  "set!": defineVar,
  lambda: returnLambdaObj,
  fn: returnLambdaObj,
  if: ifFunc,
  while: whileFunc,
  _displayFuncDepth: _displayFuncDepth,
  callMethod: call_method,
  for: forFunc,
  let: letFunc,
  switch: switchFunc,
  "++": plusPlusFunc,
  "--": minusMinusFunc,
  "+=": plusEqualFunc,
  "-=": minusEqualFunc,
  "/=": divEqualFunc,
  "*=": mulEqualFunc,
  "::": colonColonFunc,
};

const objOpts: { [key: string]: Function } = {
  exit: (...args: any) => {},
  "+": addObjs,
  "-": subObjs,
  "*": mulObjs,
  "**": powerObjs,
  "/": divObjs,
  ">": gtObjs,
  "<": ltObjs,
  ">=": geObjs,
  "<=": leObjs,
  "==": eqObjs,
  "=": eqObjs,
  abs: absObj,
  display: display,
  begin: begin,
  eval: evalExprObj,
  cdr: cdr,
  car: car,
  cons: cons,
  list: listObj,
  get: getFromContainer,
  set: setContainer,
  push: pushIntoContainer,
  dict: dictObj,
  str: makeStr, // make object into string and join them with given string
  random: randomFunc,
  randInt: randInt,
  randChoice: randChoice,
  return: returnFunc,
  class: defineClass,
  instance: defineClassInstance,
  getItem: getItem,
  setItem: setItem,
  setMethod: setMethod,
  subclass: defineSubClass,
  and: andFunc,
  or: orFunc,
  array: arrayFunc,
  setArr: setArrFunc,
  getArr: getArrFunc,
  LLM: callLLM,
  AI: callLLM,
  concat: concatFunc,
  format: formatFunc,
  macro: macroFunc,
  map: mapFunc,
  import: importFunc,
  type: typeFunc,
};

// special operators works on expressions.
export function isExprLiteralOpt(opt: Procedure): Boolean {
  for (let item in exprLiteralOpts) {
    if (item === opt.value) return true;
  }

  return false;
}

export const builtinOpts = Object.assign({}, objOpts, exprLiteralOpts);

function isValidVariableName(name: string): boolean {
  // Check if it's a C keyword
  if (Object.keys(builtinOpts).includes(name)) {
    return false;
  }

  // Check if it matches the C variable naming pattern
  const variablePattern = /^[^0-9+\-*/%^=<>!&|~][^+\-*/%^=<>!&|~]*$/;

  return variablePattern.test(name);
}
