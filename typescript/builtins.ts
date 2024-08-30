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
  ErrorObj,
  List_Obj,
  Dict_Obj,
  Lambda_Procedure,
  Procedure,
  Class_Obj,
  Undefined_Obj,
  createMultiDimArray,
  ArrayObj,
} from "./obj";
import { Env } from "./env";
import { Atom, Expr, ExprType } from "./ast";
import { evalExpr } from "./eval";
import { handleError } from "./commons";
import { Instance_Obj } from "./obj";
import { error } from "console";

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

export function add_objs(env: Env, ...args: NumberOrString[]): Obj {
  try {
    if (args.length === 0) {
      throw handleError(env,"At least one argument is required");
    }

    if (typeof args[0].value.literal === "string") {
      const result = (args as String_Obj[]).reduce(
        (acc, arg) => acc + arg.value.literal,
        ""
      );
      return new String_Obj(result);
    } else {
      let result = 0;
      for (let arg of args) {
        if (Number.isInteger(arg.value)) result += arg.value;
        else
          return handleError(
            env,
            "+ cannot be applied to objects with type except number, string",
          );
      }
      return Number.isInteger(result)
        ? new IntNumber(result)
        : new FloatNumber(result);
    }
  } catch (error) {
    return handleError(env, "+");
  }
}

export function sub_objs(env: Env, ...args: Number[]): Obj {
  try {
    let result = args[0].value;
    for (const arg of args.slice(1)) {
      if (Number.isInteger(arg.value)) result-= arg.value;
      else return handleError(env, "-")
    }
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    return handleError(env, '-');
  }
}

export function power_objs(env: Env, obj1: Number, obj2: Number): Obj {
  try {
    let result = obj1.value ** (obj2.value);
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    env.setErrorMessage("**");
    return handleError(env,"**");
  }
}

export function mul_objs(env: Env, ...args: Number[]): Obj {
  try {
    let result = 1;
    for (const arg of args) {
      result *= arg.value;
    }
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    env.setErrorMessage("*");
    return handleError(env,"*");
  }
}

export function make_str(env: Env, ...objs: Obj[]): Obj {
  try {
    let s: string = "";
    for (let i = 1; i < objs.length; i++) {
      s += String(objs[i].value);
      s += objs[0].value;
    }
    return new String_Obj(s.slice(0, -1));
  } catch (error) {
    env.setErrorMessage("str");
    return handleError(env,"str");
  }
}

export function div_objs(env: Env, ...args: Number[]): Obj {
  try {
    let result = args[0].value;
    for (const arg of args.slice(1)) {
      if (arg.value === 0) {
        throw handleError(env,"Division by zero");
      }
      result /= arg.value;
    }
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    env.setErrorMessage("/");
    return handleError(env,"/");
  }
}

export function list_obj(env: Env, ...args: Obj[]): Obj {
  try {
    let obj = new List_Obj([]);
    for (const arg of args) {
      obj.value.push(arg);
    }
    return obj;
  } catch (error) {
    env.setErrorMessage("list");
    return handleError(env,"list");
  }
}

export function dict_obj(env: Env, ...args: Obj[]): Obj {
  try {
    let obj = new Dict_Obj({});
    for (const [index, value] of args.entries()) {
      if (index % 2 === 0) {
        if (typeof args[index].value !== "string") {
          throw handleError(env,"key must be string");
        }
        obj.value[args[index].value] = args[index + 1];
      } else {
        continue;
      }
    }
    return obj;
  } catch (error) {
    env.setErrorMessage("dict");
    return handleError(env,"dict");
  }
}

export function gt_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value > arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage(">");
    return handleError(env,">");
  }
}

export function lt_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value < arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage("<");
    return handleError(env,"<");
  }
}

export function ge_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value >= arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage(">=");
    return handleError(env,">=");
  }
}

export function le_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value <= arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage("<=");
    return handleError(env,"<=");
  }
}

export function eq_objs(env: Env, arg1: Obj, arg2: Obj): Obj {
  try {
    return arg1.value === arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage("=");
    return handleError(env,"=");
  }
}

export function abs_obj(env: Env, arg: Number): Obj {
  try {
    const result = Math.abs(arg.value);
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    env.setErrorMessage("abs");
    return handleError(env,"abs");
  }
}

export function eval_expr_obj(env: Env, expr: ExprObj): Obj {
  try {
    return evalExpr(env, expr.value);
  } catch (error) {
    env.setErrorMessage("eval");
    return handleError(env,"eval");
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
    env.setErrorMessage("display");
    return handleError(env,"display");
  }
}

export function begin(env: Env, ...args: Obj[]): Obj {
  try {
    return args[args.length - 1];
  } catch (error) {
    env.setErrorMessage("begin");
    return handleError(env,"begin");
  }
}

export function cdr(env: Env, expr_obj: ExprObj): Obj {
  try {
    return new ExprObj(
      new Expr(ExprType.LST_EXPR, expr_obj.value.literal.slice(1))
    );
  } catch (error) {
    env.setErrorMessage("cdr");
    return handleError(env,"cdr");
  }
}

export function car(env: Env, expr_obj: ExprObj): Obj {
  try {
    if (expr_obj.value.type === ExprType.ATOM) {
      return new ExprObj(new Expr(ExprType.ATOM, expr_obj.value.literal));
    } else {
      if (expr_obj.value.literal[0].type === ExprType.ATOM) {
        return new ExprObj(
          new Expr(ExprType.ATOM, expr_obj.value.literal[0].literal)
        );
      } else {
        return new ExprObj(
          new Expr(ExprType.LST_EXPR, expr_obj.value.literal[0].literal)
        );
      }
    }
  } catch (error) {
    env.setErrorMessage("car");
    return handleError(env,"car");
  }
}

export function cons(env: Env, obj0: ExprObj, obj1: ExprObj): Obj {
  try {
    if (obj1.value.type === ExprType.LST_EXPR) {
      const new_obj = structuredClone(obj1.value.literal);
      new_obj.unshift(new Expr(obj0.value.type, obj0.value.literal));
      return new ExprObj(new Expr(ExprType.LST_EXPR, new_obj));
    } else {
      return new ExprObj(
        new Expr(ExprType.LST_EXPR, [
          new Expr(obj0.value.type, obj0.value.literal),
          obj1.value.literal,
        ])
      );
    }
  } catch (error) {
    env.setErrorMessage("cons");
    return handleError(env,"cons");
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

export function get_from_container(
  env: Env,
  obj1: List_Obj | Dict_Obj,
  obj0: IntNumber | String_Obj
): Obj {
  try {
    if (obj1.type === ObjType.LIST_OBJ) {
      if (obj0.value < 0) {
        throw handleError(env,"index must be positive");
      }
      if (obj1.value.length <= obj0.value) {
        throw handleError(env,
          `index ${obj0.value} must be smaller than length of list ${obj1.value.length}`
        );
      }
      return obj1.value[obj0.value];
    } else if (obj1.type === ObjType.DICT_OBJ) {
      if (obj1.value.hasOwnProperty(obj0.value)) {
        return obj1.value[obj0.value];
      } else {
        throw handleError(env,`key ${obj0.value} not found in dictionary`);
      }
    }
    throw handleError(env,"Invalid usage of get");
  } catch (error) {
    env.setErrorMessage("get");
    return handleError(env,"get");
  }
}

export function set_container(
  env: Env,
  obj1: List_Obj | Dict_Obj,
  obj0: IntNumber | String_Obj,
  value: Obj
): Obj {
  try {
    if (obj1.type === ObjType.LIST_OBJ) {
      if (obj0.value < 0) {
        throw handleError(env,"index must be positive");
      }
      if (obj1.value.length <= obj0.value) {
        throw handleError(env,
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
        throw handleError(env,`key ${obj0.value} not found in dictionary`);
      }
    }
  } catch (error) {
    env.setErrorMessage("set");
    return handleError(env,"set");
  }
}

export function push_into_container(env: Env, value: Obj, obj1: List_Obj): Obj {
  try {
    obj1.value.push(value);
    return value;
  } catch (error) {
    env.setErrorMessage("push");
    return handleError(env,"push");
  }
}

export function arrayFunc(env: Env, ...args: IntNumber[]): Obj {
  try {
    return new ArrayObj(createMultiDimArray(args.map((arg) => arg.value)));
  } catch (error) {
    env.setErrorMessage("array");
    return handleError(env,"array");
  }
}

export function setAFunc(
  env: Env,
  obj: Obj,
  arrObj: ArrayObj,
  ...Numberindexes: Number[]
): Obj {
  try {
    const indexes: number[] = Numberindexes.map((i) => i.value);
    let arr = arrObj.value;

    if (indexes.length === 1) {
      arr[indexes[0]] = obj;
    }

    for (let i = 0; i < indexes.length - 1; i++) {
      const index = indexes[i];

      // Check if the index is within bounds
      if (!Array.isArray(arr) || index >= arr.length) {
        throw handleError(env,`Index ${index} out of bounds.`);
      }

      if (i === indexes.length - 2) {
        arr[index][indexes[indexes.length - 1]] = obj;
      } else {
        arr = arr[index];
      }
    }
    return obj;
  } catch (error) {
    env.setErrorMessage("setA");
    return handleError(env,"setA");
  }
}

export function getAFunc(
  env: Env,
  arrObj: ArrayObj,
  ...Numberindexes: Number[]
): Obj {
  try {
    const indexes: number[] = Numberindexes.map((i) => i.value);
    let arr = arrObj.value;

    if (indexes.length === 1) {
      return arr[indexes[0]];
    }

    for (let i = 0; i < indexes.length - 1; i++) {
      const index = indexes[i];

      // Check if the index is within bounds
      if (!Array.isArray(arr) || index >= arr.length) {
        throw handleError(env,`Index ${index} out of bounds.`);
      }

      if (i === indexes.length - 2) {
        return arr[index][indexes[indexes.length - 1]];
      } else {
        arr = arr[index];
      }
    }
    throw error;
  } catch (error) {
    env.setErrorMessage("getA");
    return handleError(env,"getA");
  }
}

export function set_llm(env: Env, value: String_Obj): Obj {
  try {
    env.set("llm", value);
    return value;
  } catch (error) {
    env.setErrorMessage("llm");
    return handleError(env,"llm");
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
    env.setErrorMessage("random");
    return handleError(env,"random");
  }
}

export function randint(env: Env, arg1: Obj, arg2: Obj): Obj {
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
    env.setErrorMessage("randint");
    return handleError(env,"randint");
  }
}

export function randchoice(env: Env, ...args: Obj[]): Obj {
  try {
    const l = args.length;
    const i = Math.floor(Math.random() * l);
    return args[i];
  } catch (error) {
    env.setErrorMessage("randchoice");
    return handleError(env,"randchoice");
  }
}

export function returnFunc(env: Env, arg: Obj): Obj {
  try {
    env.functionDepth--;
    return arg;
  } catch (error) {
    env.setErrorMessage("return");
    return handleError(env,"return");
  }
}

export function geti(
  env: Env,
  instance_obj: Instance_Obj,
  name: Undefined_Obj
): Obj {
  try 
  {const obj = instance_obj.value.get(name.value);

  return obj;}catch (error) {
    env.setErrorMessage("return")
    return handleError(env,"return")
  }
}

export function set_method(
  env: Env,
  class_obj: Class_Obj,
  name: Undefined_Obj,
  procedure: Procedure
): Obj {
  env.classes.get(class_obj.value)?.set(name.value, procedure);

  return procedure;
}

export function call_method(env: Env,  exprList: Expr[]): Obj {
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
}

function andFunc(env: Env, ...objs: Obj[]): Obj {
  for (let obj of objs) {
    if (isTsLispFalse(obj)) return TsLispInnerFalse;
  }
  return TsLispInnerTrue;
}

function orFunc(env: Env, ...objs: Obj[]): Obj {
  for (let obj of objs) {
    if (!isTsLispFalse(obj)) return TsLispInnerTrue;
  }
  return TsLispInnerFalse;
}

export function defineClassInstance(
  env: Env,
  class_obj: Class_Obj,
  name: Undefined_Obj
): Obj {
  const instance = new Instance_Obj(
    env.classes.get(class_obj.value) as Map<string, Obj>,
    name.value,
    class_obj.value
  );
  env.set(name.value, instance);

  return instance;
}

export function seti(
  env: Env,
  instance_obj: Instance_Obj,
  name: Undefined_Obj,
  obj: Obj
): Obj {
  instance_obj.value.set(name.value, obj);

  return obj;
}

export function end_procedure(...args: any[]): void {
  // do nothing
}

export const builtinVars: { [key: string]: Bool } = {
  "#t": TRUE,
  "#f": FALSE,
};


function quote(env: Env,  exprList: Expr[]): Obj {
  try {
    if (exprList.length === 2 && exprList[1].type === ExprType.ATOM) {
      return new ExprObj(new Expr(ExprType.ATOM, exprList[1].literal));
    } else {
      return new ExprObj(new Expr(ExprType.LST_EXPR, exprList.slice(1)));
    }
  } catch (error) {
    env.setErrorMessage("quote");
    return handleError(env,"quote");
  }
}

function bind(env: Env,  exprList: Expr[]): Obj {
  try {
    const var_name = exprList[1].literal;
    const func_name = "_update_" + var_name;
    const body = exprList.slice(1).slice(1);
    const lambdaString = `function ${func_name}`;
    const expressions = new Lambda_Procedure(
      lambdaString,
      "evalLambdaObj",
      [] as Expr[],
      body,
    );
    env.set(func_name, expressions);
    return expressions;
  } catch (error) {
    env.setErrorMessage("bind");
    return handleError(env,"bind");
  }
}

function atomAsEnvKey(expr: Expr): Obj {
  return new Obj(expr.literal);
}

function evalProcedureValue(
  bodyEnv: Env,
  argNames: Expr[],
  body: Expr[],
  ...args: any[]
): Obj {
  try {
    if (args.length !== argNames.length) {
      console.error("Error: Invalid number of arguments");
    }

    let workingEnv: Env;

    workingEnv = new Env();
      for (let [key, value] of bodyEnv) {
        if (value !== undefined) workingEnv.set(key, value);
      } // structuredClone(bodyEnv) is WRONG!


    // when entering function, env.funtionDepth ++
    workingEnv.functionDepth = bodyEnv.functionDepth + 1;

    argNames.forEach((argName, index) => {
      if (typeof argName.literal === "string") {
        workingEnv.set(argName.literal, args[index]);
      } else {
        console.error(
          `Error: Invalid argument name type: ${typeof argName.literal}`
        );
      }
    });

    let result: Obj = None_Obj;
    let funcDepth = workingEnv.functionDepth;
    for (let expr of body) {
      result = evalExpr(workingEnv, expr);
      if (workingEnv.functionDepth < funcDepth) {
        return result;
      }
    }
    return result;
  } catch (error) {
    bodyEnv.setErrorMessage("evalProcedureValue");
    return handleError(bodyEnv,"evalProcedureValue");
  }
}

function forFunc(env: Env,  body: Expr[]): Obj {
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
    env.setErrorMessage("for");
    return handleError(env,"for");
  }
}

function updateVar(env: Env,  exprList: Expr[]): Obj {
  try {
    const objValue = evalExpr(env, exprList[2])
    
    env.set((exprList[1].literal as Atom), objValue);

    const procedure = env.get(
      `_update_${exprList[1].literal}`
    ) as Lambda_Procedure;
    if (procedure !== undefined) {
      evalProcedureValue(env, [], procedure.body as Expr[]);
    }
    return objValue;
  } catch (error) {
    env.setErrorMessage("updateVar");
    return handleError(env,"updateVar");
  }
}

function defineVar(env: Env,  exprList: Expr[]): Obj {
  try {
    const parameters = [atomAsEnvKey(exprList[1]), evalExpr(env, exprList[2])];
    env.set(parameters[0].value, parameters[1]);
    return parameters[1];
  } catch (error) {
    env.setErrorMessage("defineVar");
    return handleError(env,"defineVar");
  }
}

export function ifFunc(env: Env,  exprList: Expr[]): Obj {
  try {
    const condition: Obj = evalExpr(env, exprList[1]);
    if (isTsLispFalse(condition)) {
      if (exprList.length === 4) return evalExpr(env, exprList[3]);
      else return new IntNumber(0);
    } else {
      return evalExpr(env, exprList[2]);
    }
  } catch (error) {
    env.setErrorMessage("if");
    return handleError(env,"if");
  }
}

export function whileFunc(env: Env,  exprList: Expr[]): Obj {
  try {
    let condition: Obj = evalExpr(env, exprList[1]);
    let result: Obj = None_Obj;
    while (
      !(
        condition === FALSE ||
        condition === None_Obj ||
        (condition.value === 0)
      )
    ) {
      for (let i = 2; i < exprList.length - 1; i++) {
        evalExpr(env, exprList[i]);
      }
      result = evalExpr(env, exprList[exprList.length - 1]);
      condition = evalExpr(env, exprList[1]);
    }
    return result;
  } catch (error) {
    env.setErrorMessage("while");
    return handleError(env,"while");
  }
}

function lambdaObj(env: Env,  exprList: Expr[]): Obj {
  exprList = exprList.slice(1)
  let argNames = exprList[0].literal as Expr[];
  let body = exprList.slice(1);

  const functionString = `(${argNames.map((arg) => arg.literal).join(", ")})`;
  const lambdaString = `function${functionString}`;

  const func = new Lambda_Procedure(
    lambdaString,
    "evalLambdaObj",
    (argNames = argNames),
    (body = body),
  );

  return func
}


function evalLambdaObj(env: Env, opt: Procedure,  exprList: Expr[]): Obj {
  const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));
  if (opt instanceof Lambda_Procedure) {
    return evalProcedureValue(
      env,
      opt.argNames,
      opt.body as Expr[],
      ...parameters
    );
  } else {
    return handleError(env,"invalid use of procedure");
  }
}

function _displayFuncDepth(env: Env,  exprList: Expr[]): Obj {
  return new IntNumber(env.functionDepth);
}

const expression_operators: { [key: string]: Function } = {
  quote: quote,
  bind: bind,
  update: updateVar,
  define: defineVar,
  "set!": defineVar,
  lambda: lambdaObj,
  evalLambdaObj: evalLambdaObj,
  if: ifFunc,
  while: whileFunc,
  _displayFuncDepth: _displayFuncDepth,
  callm: call_method,
  for: forFunc,
};

const object_operators: { [key: string]: Function } = {
  exit: end_procedure,
  "+": add_objs,
  "-": sub_objs,
  "*": mul_objs,
  "**": power_objs,
  "/": div_objs,
  ">": gt_objs,
  "<": lt_objs,
  ">=": ge_objs,
  "<=": le_objs,
  "=": eq_objs,
  abs: abs_obj,
  display: display,
  begin: begin,
  eval: eval_expr_obj,
  cdr: cdr,
  car: car,
  cons: cons,
  list: list_obj,
  get: get_from_container,
  set: set_container,
  push: push_into_container,
  dict: dict_obj,
  llm: set_llm, // set which llm to use
  str: make_str, // make very object into string and join them with given string
  random: randomFunc,
  randint: randint,
  randchoice: randchoice,
  return: returnFunc,
  class: defineClass,
  instance: defineClassInstance,
  geti: geti,
  seti: seti,
  setm: set_method,
  subclass: defineSubClass,
  and: andFunc,
  or: orFunc,
  array: arrayFunc,
  setA: setAFunc,
  getA: getAFunc,
};


// special operators works on expressions.
export function is_special_operator(opt: Procedure): Boolean {
  for (let s_opt in expression_operators) {
    if (s_opt === opt.name) return true;
  }

  return false;
}

export const builtin_operators = Object.assign(
  {},
  object_operators,
  expression_operators
);

