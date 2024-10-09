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
  createMultiDimArray,
  ArrayObj,
  AIObj,
  ErrorObj,
  ThrowError,
  StructObj,
} from "./obj";
import { Env, loopOverLiteralExprs } from "./env";
import { Atom, Expr, ExprType } from "./ast";
import { evalExpr, evalExprs, getFromEnv } from "./eval";
import { handleError } from "./commons";
import { Instance_Obj } from "./obj";
import { error } from "console";
import { tokenize } from "./token";
import { parseExprs } from "./parser";
import { readFileSync } from "fs";

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

function unshiftFunc(env: Env, ...args: Obj[]): Obj {
  try {
    (args[0] as List_Obj).value.unshift(args[1]);
    return new IntNumber((args[0] as List_Obj).value.length);
  } catch (error) {
    return handleError(env, "shift");
  }
}

function throwFunc(env: Env, ...args: Obj[]): Obj {
  try {
    env.thrownError = new ThrowError(args[0].value as string);
    return None_Obj;
  } catch (error) {
    return handleError(env, "throw");
  }
}

function childMethodFunc(env: Env, ...args: Obj[]): Obj {
  try {
    (args[2] as Lambda_Procedure).env.tsLispThis = args[0];
    args[0].subObjs.set((args[1] as String_Obj).value as string, args[2]);
    return args[2];
  } catch (error) {
    return handleError(env, "child-method");
  }
}

function getChildFunc(env: Env, ...args: Obj[]): Obj {
  try {
    return args[0].subObjs.get(args[1].value as string) as Obj;
  } catch (error) {
    return handleError(env, "get-child");
  }
}

function childFunc(env: Env, ...args: Obj[]): Obj {
  try {
    args[0].subObjs.set((args[1] as String_Obj).value, args[2]);
    return args[2];
  } catch (error) {
    return handleError(env, "child");
  }
}

function sliceFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const newLst = (args[0] as List_Obj).value.slice(
      ...args.slice(1).map((e) => e.value as number)
    );
    const res = new List_Obj(newLst);
    return res;
  } catch (error) {
    return handleError(env, "slice");
  }
}

function spliceFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const lst: List_Obj = args[0] as List_Obj;
    const index: number = (args[1] as IntNumber).value;
    const numberOfObjsToBeDeleted: number = (args[2] as IntNumber).value;
    args.splice(0, 2);

    lst.value.splice(index, numberOfObjsToBeDeleted, ...args);

    return lst;
  } catch (error) {
    return handleError(env, "splice");
  }
}

function shiftFunc(env: Env, ...args: Obj[]): Obj {
  try {
    return (args[0] as List_Obj).value.shift();
  } catch (error) {
    return handleError(env, "shift");
  }
}

function includedFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const lst: List_Obj = args[0] as List_Obj;
    let obj: number | string;
    let typeOfGivenObj = typeof args[1].value;
    if (typeOfGivenObj === "number") {
      obj = args[1].value as number;
    } else if (typeOfGivenObj === "string") {
      obj = args[1].value as string;
    } else {
      throw error;
    }
    for (let i = 0; i < lst.value.length; i++) {
      if (typeof lst.value[i].value === typeOfGivenObj) {
        if (lst.value[i].value === obj) return new IntNumber(1);
      }
    }
    return None_Obj;
  } catch (error) {
    return handleError(env, "find");
  }
}

function indexFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const lst: List_Obj = args[0] as List_Obj;
    let obj: number | string;
    let typeOfGivenObj = typeof args[1].value;
    if (typeOfGivenObj === "number") {
      obj = args[1].value as number;
    } else if (typeOfGivenObj === "string") {
      obj = args[1].value as string;
    } else {
      throw error;
    }
    for (let i = 0; i < lst.value.length; i++) {
      if (typeof lst.value[i].value === typeOfGivenObj) {
        if (lst.value[i].value === obj) return new IntNumber(i);
      }
    }
    return None_Obj;
  } catch (error) {
    return handleError(env, "find");
  }
}

export function filterFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const lst: List_Obj = args[0] as List_Obj;
    const funcObj: Lambda_Procedure = args[1] as Lambda_Procedure;
    const result: List_Obj = new List_Obj([]);

    for (const value of lst.value) {
      const r = evalProcedureValue(
        funcObj.env,
        funcObj.argNames,
        funcObj.body as Expr[],
        value
      );
      if (!isTsLispFalse(r)) result.value.push(r);
    }

    return result;
  } catch (error) {
    return handleError(env, "filter");
  }
}

export function reduceFunc(env: Env, ...args: Obj[]): Obj {
  try {
    const lst: List_Obj = args[0] as List_Obj;
    let start: Obj = args[1];
    const funcObj: Lambda_Procedure = args[2] as Lambda_Procedure;

    for (const value of lst.value) {
      start = evalProcedureValue(
        funcObj.env,
        funcObj.argNames,
        funcObj.body as Expr[],
        start,
        value
      );
    }

    return start;
  } catch (error) {
    return handleError(env, "reduce");
  }
}

export function percentFunc(env: Env, ...args: Obj[]): Obj {
  try {
    if (!(args[0].name === "IntNumber" && args[1].name === "IntNumber")) {
      return handleError(env, "% should be used between integers.");
    }
    return new IntNumber(args[0].value % args[1].value);
  } catch (error) {
    return handleError(env, "percent");
  }
}

export function rangeFunc(env: Env, ...args: Obj[]): Obj {
  const lstObj = new List_Obj([]);
  for (let i = 0; i < args.length; i++) {
    lstObj.value.push(new IntNumber(i));
  }
  return lstObj;
}

export function notFunc(env: Env, ...args: Obj[]): Obj {
  try {
    if (isTsLispFalse(args[0])) {
      return TsLispInnerFalse;
    } else {
      return TsLispInnerTrue;
    }
  } catch (error) {
    return handleError(env, "not/!");
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

export function thisFunc(env: Env, exprList: Expr[]): Obj {
  if (env.tsLispThis instanceof Env) {
    return env.getFromEnv(exprList[1].value as string) || None_Obj;
  } else {
    let obj = env.tsLispThis;
    if (!obj) return None_Obj;
    else {
      let res = obj.subObjs.get(exprList[1].value as string);
      if (!res) return None_Obj;
      return res;
    }
  }
}

export function objectCreateFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const theObjWeInheritFrom = evalExpr(env, exprList[2]);
    let result: Obj;
    if (exprList.length === 4) {
      result = new Obj(evalExpr(env, exprList[3]));
    } else {
      result = new IntNumber(0);
    }
    for (let [key, subObj] of theObjWeInheritFrom.subObjs) {
      result.subObjs.set(key, subObj);
    }

    env.set(exprList[1].value as string, result);

    return result;
  } catch (error) {
    return handleError(env, "object-create");
  }
}

export function literalFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const regularExprStr: string = exprList[1].value as string;
    const regex = new RegExp(regularExprStr);
    env.literalRegExps.push([regex, exprList.slice().slice()]);

    return None_Obj;
  } catch (error) {
    return handleError(env, "literal");
  }
}

export function enumFunc(env: Env, exprList: Expr[]): Obj {
  try {
    for (let i = 1; i < exprList.length; i++) {
      env.set(exprList[i].value as string, new IntNumber(i - 1));
    }
    return None_Obj;
  } catch (error) {
    return handleError(env, "enum");
  }
}

function structFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const result = new StructObj();
    const structName = exprList[1].value as string;
    exprList.shift();
    exprList.shift();

    if (exprList.length === 0) return None_Obj;

    if (Array.isArray(exprList[0].value)) {
      if ((exprList[0].value[0] as Expr).value === "private") {
        for (const name of exprList[0].value.slice(1)) {
          result.privates.set((name as Expr).value as string, None_Obj);
        }
      }
      if ((exprList[0].value[0] as Expr).value === "public") {
        for (const name of exprList[0].value.slice(1)) {
          result.publics.set((name as Expr).value as string, None_Obj);
        }
      }
    }

    exprList.shift();

    if (Array.isArray(exprList[0].value)) {
      if ((exprList[0].value[0] as Expr).value === "private") {
        for (const name of exprList[0].value.slice(1)) {
          result.privates.set((name as Expr).value as string, None_Obj);
        }
      }
      if ((exprList[0].value[0] as Expr).value === "public") {
        for (const name of exprList[0].value.slice(1)) {
          result.publics.set((name as Expr).value as string, None_Obj);
        }
      }
    }

    exprList.shift();

    for (let i = 0; i < exprList.length; i += 2) {
      result.set(exprList[i].value as string, evalExpr(env, exprList[i + 1]));
    }

    env.set(structName, result);

    return result;
  } catch (error) {
    return handleError(env, "struct");
  }
}

function questionMarkEqual(env: Env, args: Expr[]): Obj {
  try {
    const cond = evalExpr(env, args[1]);
    if (!isTsLispFalse(cond)) {
      env.set(args[2].value as string, cond);
      return cond;
    } else {
      const res = evalExprs(env, args.slice(2));
      return res;
    }
  } catch (error) {
    return handleError(env, "?=");
  }
}

function tryFunc(env: Env, args: Expr[]): Obj {
  try {
    let testedObj = evalExpr(env, args[1]);
    if (env.thrownError) {
      testedObj = env.thrownError;
      env.thrownError = undefined;

      env.set("error", new String_Obj((testedObj as ThrowError).value));
      const ObjGotFromProcessingError = evalExpr(env, args[2]);
      env.set("error", None_Obj);
      return ObjGotFromProcessingError;
    } else return testedObj;
  } catch (error) {
    return handleError(env, "try");
  }
}

function foreachFunc(env: Env, args: Expr[]): Obj {
  try {
    const relatedFunc: Expr = args[2];
    const relatedLst: Obj = env.getFromEnv(args[1].value as string) as Obj;
    const opt = evalExpr(env, relatedFunc);

    for (let i = 0; i < (relatedLst.value as []).length; i++) {
      evalExprStartingWithLambdaObj(env, opt, [
        relatedFunc,
        new Expr(ExprType.ATOM, relatedLst.value[i].value as string),
      ]);
    }

    return None_Obj;
  } catch (error) {
    return handleError(env, "foreach");
  }
}

export function defineSubClass(env: Env, exprList: Expr[]): Obj {
  try {
    let classProperties: Map<string, Obj> = env.classes.get(
      exprList[1].value as string
    ) as Map<string, Obj>;
    const subclassName: string = exprList[2].value as string;

    for (let i = 3; i < exprList.length; i++) {
      classProperties.set(exprList[i].value as string, None_Obj);
    }

    env.classes.set(subclassName, classProperties);

    env.set(subclassName, new Class_Obj(subclassName));

    return None_Obj;
  } catch (error) {
    return handleError(env, "subclass");
  }
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

export function concatFunc(env: Env, obj1: List_Obj, obj2: List_Obj): Obj {
  try {
    obj1.value.concat(obj2.value);
    return obj1;
  } catch (error) {
    return handleError(env, "concat");
  }
}

export function popFromContainer(env: Env, obj1: List_Obj): Obj {
  try {
    const result = obj1.value.pop();
    return result;
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

export function getItem(env: Env, exprList: Expr[]): Obj {
  try {
    const instanceName: string = exprList[1].value as string;
    const obj: Instance_Obj = env.getFromEnv(instanceName) as Instance_Obj;
    const result = obj.value.get(exprList[2].value as string);

    return result;
  } catch (error) {
    return handleError(env, "return");
  }
}

export function setMethod(env: Env, exprList: Expr[]): Obj {
  try {
    const classObj = env.get(exprList[1].value as string);
    const name = exprList[2].value;
    const procedure = evalExpr(env, exprList[3]);
    env.classes
      .get((classObj as Class_Obj).value)
      ?.set(name as string, procedure);

    return procedure;
  } catch (error) {
    return None_Obj;
  }
}

// export function setMethod(
//   env: Env,
//   classObj: Class_Obj,
//   name: Undefined_Obj,
//   procedure: Procedure
// ): Obj {
//   try {
//     env.classes.get(classObj.value)?.set(name.value, procedure);

//     return procedure;
//   } catch (error) {
//     return None_Obj;
//   }
// }

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

export function defineClass(env: Env, exprList: Expr[]): Obj {
  let classProperties = new Map<string, Obj>();

  exprList.shift();
  const className = exprList.shift();

  for (let arg of exprList) {
    classProperties.set(arg.value as string, None_Obj);
  }

  env.classes.set(className?.value as string, classProperties);

  const obj = new Class_Obj(className?.value as string);

  env.set(className?.value as string, obj);

  return obj;
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
    const parameters: Obj[] = [
      evalExpr(env, exprList[1]),
      new String_Obj(exprList[2].value as string),
    ];

    for (let i = 3; i < exprList.length; i++) {
      parameters.push(evalExpr(env, exprList[i]));
    }

    const instance = parameters[0] as Instance_Obj;
    const methodName = parameters[1] as String_Obj;

    env.newThis(instance.instanceName, instance);

    const procedure: Procedure = env.classes
      .get(instance.className)
      ?.get(methodName.value) as Procedure;

    const obj: Obj = evalExprStartingWithLambdaObj(
      env,
      procedure,
      exprList.slice(2)
    );

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

export function defineClassInstance(env: Env, exprList: Expr[]): Obj {
  try {
    const classObj: Map<string, Obj> = env.classes.get(
      exprList[1].value as string
    ) as Map<string, Obj>;

    const instance = new Instance_Obj(
      classObj as Map<string, Obj>,
      exprList[2].value as string,
      exprList[1].value as string
    );
    env.set(exprList[2].value as string, instance);

    return instance;
  } catch (error) {
    return handleError(env, "instance");
  }
}

export function setItem(env: Env, exprList: Expr[]): Obj {
  try {
    const instanceObj: Instance_Obj = env.getFromEnv(
      exprList[1].value as string
    ) as Instance_Obj;
    const result = evalExpr(env, exprList[3]);
    instanceObj.value.set(exprList[2].value, result);

    return result;
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

    if (whereIsVar) {
      if (!isNotConst(whereIsVar, exprList[1].value as Atom)) {
        return None_Obj;
      } else {
        whereIsVar.set(exprList[1].value as Atom, objValue);
      }
    } else {
      env.set(exprList[1].value as Atom, objValue);
    }

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
    let varName: Obj = None_Obj;
    let varValue: Obj = None_Obj;
    for (let i = 1; i < exprList.length; i += 2) {
      varName = atomAsEnvKey(exprList[i]);
      if (!isNotConst(env, varName.value)) {
        return None_Obj;
      }

      varValue = evalExpr(env, exprList[i + 1]);

      isValidVariableName(varName.value);

      env.set(varName.value, varValue);
      loopOverLiteralExprs(env, varName.value);
    }

    return varValue;
  } catch (error) {
    return handleError(env, "defineVar");
  }
}

function constFunc(env: Env, exprList: Expr[]): Obj {
  try {
    const varName = atomAsEnvKey(exprList[1]);
    const varValue = evalExpr(env, exprList[2]);

    isValidVariableName(varName.value);

    env.set(varName.value, varValue);
    env.constVarNames.push(varName.value);
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
    let argNames: Expr[] = [];
    let requirements: [number, string][] = [];

    for (const item of exprList[0].value) {
      if (((item as Expr).value as string)[0] !== ":") {
        argNames.push(item as Expr);
      } else {
        const i = argNames.length - 1;
        const l = ((item as Expr).value as string).length;
        const typeName: string = ((item as Expr).value as string).slice(1, l);
        requirements.push([i, typeName]);
      }
    }

    let body = exprList.slice(1);

    const functionString = `(${argNames.map((arg) => arg.value).join(", ")})`;
    const lambdaString = `function${functionString}`;

    const func = new Lambda_Procedure(
      "LambdaObj",
      lambdaString,
      (argNames = argNames),
      (body = body),
      (env = env),
      requirements
    );

    return func;
  } catch (error) {
    return handleError(env, "LambdaObj");
  }
}

export function evalExprStartingWithLambdaObj(
  env: Env,
  opt: Procedure,
  exprList: Expr[]
): Obj {
  try {
    const parameters: Obj[] = [];
    for (let i = 1; i < exprList.length; i++) {
      parameters.push(evalExpr(env, exprList[i]));
    }

    for (const item of (opt as Lambda_Procedure).requirements) {
      if (parameters[item[0]].name !== item[1]) {
        return handleError(
          env,
          "type of function argument does not match requirement."
        );
      }
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

export function typeFunc(env: Env, opt: Procedure): Obj {
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
      return handleError(env, "Error: Invalid number of arguments");
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
  const: constFunc,
  class: defineClass,
  instance: defineClassInstance,
  getItem: getItem,
  setItem: setItem,
  setMethod: setMethod,
  subclass: defineSubClass,
  literal: literalFunc,
  "object-create": objectCreateFunc,
  this: thisFunc,
  foreach: foreachFunc,
  try: tryFunc,
  enum: enumFunc,
  "?=": questionMarkEqual,
  struct: structFunc,
  // new: newFunc,
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
  pop: popFromContainer,
  dict: dictObj,
  str: makeStr, // make object into string and join them with given string
  random: randomFunc,
  randInt: randInt,
  randChoice: randChoice,
  return: returnFunc,

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
  not: notFunc,
  "!": notFunc,
  range: rangeFunc,
  "%": percentFunc,
  reduce: reduceFunc,
  filter: filterFunc,
  index: indexFunc,
  includes: includedFunc,
  shift: shiftFunc,
  unshift: unshiftFunc,
  splice: spliceFunc,
  slice: sliceFunc,
  child: childFunc,
  "get-child": getChildFunc,
  "child-method": childMethodFunc,
  throw: throwFunc,
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

function isNotConst(env: Env, name: string): boolean {
  return !env.constVarNames.includes(name);
}

export function getMethodByUsingDot(env: Env, name: string): Obj {
  try {
    const names = name.split(".");

    const relatedClassMethodsAndProperties: Map<string, Obj> | undefined =
      env.classes.get((getFromEnv(env, names[0]) as Instance_Obj).className);

    if (!relatedClassMethodsAndProperties) throw error;

    const res = relatedClassMethodsAndProperties.get(names[1]);
    if (!res) return None_Obj;
    else return res;
  } catch (error) {
    return handleError(env, name + " is not defined");
  }
}

export function getPropertyByUsingDot(env: Env, name: string): Obj {
  try {
    const names = name.split(".");

    const instance: Instance_Obj = env.getFromEnv(names[0]) as Instance_Obj;
    let result = instance.value.get(names[1]);

    return result;
  } catch (error) {
    return handleError(env, name + " is not defined");
  }
}

export function getMethodOrPropertyUsingDot(env: Env, name: string): Obj {
  try {
    let obj: Obj = getMethodByUsingDot(env, name);
    if (!obj.value) {
      obj = getPropertyByUsingDot(env, name);
      if (!obj.value) throw error;
      else return obj;
    } else {
      return obj;
    }
  } catch (error) {
    return handleError(env, name + " is not defined");
  }
}
