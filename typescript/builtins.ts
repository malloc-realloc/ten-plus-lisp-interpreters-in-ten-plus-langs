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
  Error,
  List_Obj,
  Dict_Obj,
  Lambda_Procedure,
  Procedure,
} from "./obj";
import { Env } from "./env";
import { Expr, ExprType } from "./ast";
import { evalExpr } from "./eval";
import { cond, random } from "lodash";

type Number = IntNumber | FloatNumber;

export function add_objs(
  env: Env,
  ...args: Number[] | String_Obj[]
): Number | String_Obj | Obj {
  // + has different meanings when manipulating different kinds of Obj
  if (args[0].type === ObjType.STRING_OBJ) {
    let result = "";
    for (const arg of args) {
      result += arg.value.literal;
    }
    return new String_Obj(result);
  } else {
    let result = 0;
    for (const arg of args) {
      result += arg.value;
    }
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  }

  return None_Obj;
}

export function sub_objs(env: Env, ...args: Number[]): Number {
  let result = args[0].value;
  for (const arg of args.slice(1)) {
    result -= arg.value;
  }
  if (Number.isInteger(result)) {
    return new IntNumber(result);
  } else {
    return new FloatNumber(result);
  }
}

export function mul_objs(env: Env, ...args: Number[]): Number {
  let result = 1;
  for (const arg of args) {
    result *= arg.value;
  }
  if (Number.isInteger(result)) {
    return new IntNumber(result);
  } else {
    return new FloatNumber(result);
  }
}

export function make_str(env: Env, ...objs: Obj[]): String_Obj {
  // (str String_Obj obj1 obj2 ...)
  let s: string = "";
  for (let i = 1; i < objs.length; i++) {
    s += String(objs[i].value);
    s += objs[0].value;
  }

  return new String_Obj(s.slice(0, -1)); // skip the last indent
}

export function div_objs(env: Env, ...args: Number[]): Number {
  let result = args[0].value;
  for (const arg of args.slice(1)) {
    result /= arg.value;
  }
  if (Number.isInteger(result)) {
    return new IntNumber(result);
  } else {
    return new FloatNumber(result);
  }
}

export function list_obj(env: Env, ...args: Obj[]): List_Obj {
  let obj = new List_Obj([]);
  for (const arg of args) {
    obj.value.push(arg);
  }
  return obj;
}

export function dict_obj(env: Env, ...args: Obj[]): Error | Dict_Obj {
  let obj = new Dict_Obj({});
  for (const [index, value] of args.entries()) {
    if (index % 2 === 0) {
      if (args[index].type !== ObjType.STRING_OBJ) {
        return new Error("Error: key must be string");
      }
      obj.value[args[index].value] = args[index + 1];
    } else {
      continue;
    }
  }
  return obj;
}

export function gt_objs(env: Env, arg1: Number, arg2: Number): Bool {
  return arg1.value > arg2.value ? TRUE : FALSE;
}

export function lt_objs(env: Env, arg1: Number, arg2: Number): Bool {
  return arg1.value < arg2.value ? TRUE : FALSE;
}

export function ge_objs(env: Env, arg1: Number, arg2: Number): Bool {
  return arg1.value >= arg2.value ? TRUE : FALSE;
}

export function le_objs(env: Env, arg1: Number, arg2: Number): Bool {
  return arg1.value <= arg2.value ? TRUE : FALSE;
}

export function eq_objs(env: Env, arg1: Obj, arg2: Obj): Bool {
  return arg1.value === arg2.value ? TRUE : FALSE;
}

export function abs_obj(env: Env, arg: Number): Number {
  const result = Math.abs(arg.value);
  if (Number.isInteger(result)) {
    return new IntNumber(result);
  } else {
    return new FloatNumber(result);
  }
}

export function eval_expr_obj(env: Env, expr: ExprObj): Obj {
  return evalExpr(env, expr.value);
}

export function display(env: Env, ...args: Obj[]): Obj {
  if (
    args[0].type === ObjType.STRING_OBJ ||
    args[0].type === ObjType.LLM_EXPR_OBJ
  ) {
    for (const arg of args) {
      console.log(arg.value.literal);
    }
    return args[args.length - 1];
  } else {
    for (const arg of args) {
      console.log(arg.value);
    }
    return args[args.length - 1];
  }
}

export function begin(env: Env, ...args: Obj[]): Obj {
  return args[args.length - 1];
}

export function end_procedure(...args: any[]): void {
  // do nothing
}

export function cdr(env: Env, expr_obj: ExprObj): ExprObj {
  return new ExprObj(
    new Expr(ExprType.LST_EXPR, expr_obj.value.literal.slice(1))
  );
}

export function car(env: Env, expr_obj: ExprObj): ExprObj {
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
}

export function cons(env: Env, obj0: ExprObj, obj1: ExprObj): ExprObj {
  if (obj1.value.type === ExprType.LST_EXPR) {
    // use structuredClone to deepcopy
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
}

export function get_from_container(
  env: Env,
  obj0: IntNumber | String_Obj,
  obj1: List_Obj | Dict_Obj
): Obj {
  if (obj1.type === ObjType.LIST_OBJ) {
    if (obj0.value < 0) {
      return new Error(`index must be positive`);
    }

    if (obj1.value.length <= obj0.value) {
      return new Error(
        `index ${obj0.value} must be smaller than length of list ${obj1.value.le_objs}`
      );
    }

    return obj1.value[obj0.value];
  } else if (obj1.type === ObjType.DICT_OBJ) {
    // equivalent to (obj0.value in obj1.value) in python
    if (obj1.value.hasOwnProperty(obj0.value)) {
      return obj1.value[obj0.value];
    } else {
      return new Error(`Error: key ${obj0.value} not found in dictionary`);
    }
  }

  return new Error(`Invalid usage of get`);
}

export function set_container(
  env: Env,
  obj0: IntNumber | String_Obj,
  value: Obj,
  obj1: List_Obj | Dict_Obj
): Obj {
  if (obj1.type === ObjType.LIST_OBJ) {
    if (obj0.value < 0) {
      return new Error(`index must be positive`);
    }

    if (obj1.value.length <= obj0.value) {
      return new Error(
        `index ${obj0.value} must be smaller than length of list ${obj1.value.le_objs}`
      );
    }

    obj1.value[obj0.value] = value;
    return value;
  } else {
    if (obj1.value.hasOwnProperty(obj0.value)) {
      obj1.value[obj0.value] = value;
      return value;
    } else {
      return new Error(`Error: key ${obj0.value} not found in dictionary`);
    }
  }
}

export function push_into_container(env: Env, value: Obj, obj1: List_Obj): Obj {
  obj1.value.push(value);
  return value;
}

export function set_llm(env: Env, value: String_Obj): Obj {
  env.set("llm", value);
  return value;
}

export function random_func(env: Env, arg1: Obj, arg2: Obj): Obj {
  const n1 = arg1.value;
  const n2 = arg2.value;
  const min = Math.min(n1, n2);
  const max = Math.max(n1, n2);
  const result = new IntNumber(Math.random() * (max - min) + min);
  return result;
}

export function randint(env: Env, arg1: Obj, arg2: Obj): Obj {
  const n1 = arg1.value;
  const n2 = arg2.value;
  const min = Math.floor(Math.min(n1, n2));
  const max = Math.ceil(Math.max(n1, n2));
  const result = new IntNumber(
    Math.floor(Math.random() * (max - min + 1) + min)
  );
  return result;
}

export function randchoice(env: Env, ...args: Obj[]): Obj {
  const l = args.length - 1;
  const i = Math.floor(Math.random() * (l + 1));
  return args[i];
}

export const builtin_vars: { [key: string]: Bool } = {
  "#t": TRUE,
  "#f": FALSE,
};

export function returnFunc(env: Env, arg: Obj): Obj {
  env.functionDepth--;
  return arg;
}

const object_operators: { [key: string]: Function } = {
  exit: end_procedure,
  "+": add_objs,
  "-": sub_objs,
  "*": mul_objs,
  "/": div_objs,
  ">": gt_objs,
  "<": lt_objs,
  ">=": ge_objs,
  "<=": le_objs,
  "=": eq_objs,
  abs: abs_obj,
  display: display,
  begin: begin,
  // if: if_func,
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
  random: random_func,
  randint: randint,
  randchoice: randchoice,
  return: returnFunc,
};

function quote(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  if (exprList.length === 2 && exprList[1].type === ExprType.ATOM) {
    return new ExprObj(new Expr(ExprType.ATOM, exprList[1].literal));
  } else {
    return new ExprObj(new Expr(ExprType.LST_EXPR, exprList.slice(1)));
  }
}

function bind(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  const var_name = exprList[1].literal;
  const func_name = "_update_" + var_name;
  const body = exprList.slice(1).slice(1);
  const lambdaString = `function ${func_name}`;
  const expressions = new Lambda_Procedure(
    lambdaString,
    "lambda_eval",
    ObjType.LAMBDA_PROCEDURE,
    [] as Expr[],
    body,
    (env = env),
    false
  );
  env.set(func_name, expressions);
  return expressions;
}

function atomAsEnvKey(expr: Expr): Obj {
  return new Obj(expr.literal, ObjType.NONE);
}

// TODO: BIG ERROR: RETURN CANNOT ESCAPE FROM IF,BLOCK etc.
function evalProcedureValue(
  bodyEnv: Env,
  argNames: Expr[],
  body: Expr[],
  require_new_env_when_eval: Boolean,
  ...args: any[]
): Obj {
  if (args.length !== argNames.length) {
    console.error("Error: Invalid number of arguments");
  }

  let workingEnv: Env;
  if (require_new_env_when_eval) {
    workingEnv = new Env();
    for (let [key, value] of bodyEnv) {
      if (value !== undefined) workingEnv.set(key, value);
    } // structuredClone(bodyEnv) is WRONG!
  } else {
    workingEnv = bodyEnv;
  }

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
  for (let expr of body) {
    let funcDepth = workingEnv.functionDepth;
    result = evalExpr(workingEnv, expr);
    if (workingEnv.functionDepth < funcDepth) {
      return result;
    }
  }
  return result;
}

function update_var(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  const parameters = [atomAsEnvKey(exprList[1]), evalExpr(env, exprList[2])];
  env.set(parameters[0].value, parameters[1]);

  const obj = parameters[1];
  const procedure = env.get(
    `_update_${exprList[1].literal}`
  ) as Lambda_Procedure;
  if (procedure !== undefined) {
    evalProcedureValue(procedure.env, [], procedure.body as Expr[], false);
  }
  return obj;
}

function define_var(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  const parameters = [atomAsEnvKey(exprList[1]), evalExpr(env, exprList[2])];
  env.set(parameters[0].value, parameters[1]);
  return parameters[1];
}

// export function if_func(env: Env, ...args: Obj[]): Obj {
//   if (
//     args[0] !== FALSE &&
//     args[0] !== None_Obj &&
//     !(args[0].type === ObjType.INT && args[0].value === 0)
//   ) {
//     return args[1];
//   } else if (args.length === 2) {
//     return None_Obj;
//   } else if (args.length === 3) {
//     return args[2];
//   } else {
//     return None_Obj;
//   }
// }

export function if_func(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  const condition: Obj = evalExpr(env, exprList[1]);
  if (
    condition === FALSE ||
    condition === None_Obj ||
    (condition.type === ObjType.INT && condition.value === 0)
  ) {
    if (exprList.length === 4) return evalExpr(env, exprList[3]);
    else return new IntNumber(0);
  } else {
    return evalExpr(env, exprList[2]);
  }
}

export function while_func(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  let condition: Obj = evalExpr(env, exprList[1]);
  let result: Obj = None_Obj;
  while (
    !(
      condition === FALSE ||
      condition === None_Obj ||
      (condition.type === ObjType.INT && condition.value === 0)
    )
  ) {
    for (let i = 2; i < exprList.length - 1; i++) {
      evalExpr(env, exprList[i]);
    }
    result = evalExpr(env, exprList[exprList.length - 1]);
    condition = evalExpr(env, exprList[1]);
  }
  return result;
}

function evalLambdaExpr(env: Env, exprList: Expr[]): Procedure {
  let argNames = exprList[0].literal as Expr[];
  let body = exprList.slice(1);

  const procedure_env = new Env();
  for (let [key, value] of env) {
    if (value != undefined) procedure_env.set(key, value);
  }

  const functionString = `(${argNames.map((arg) => arg.literal).join(", ")})`;
  const lambdaString = `function${functionString}`;

  const func = new Lambda_Procedure(
    lambdaString,
    "lambda_eval",
    ObjType.LAMBDA_PROCEDURE,
    (argNames = argNames),
    (body = body),
    (env = procedure_env)
  );

  return func;
}

function lambda_func(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  return evalLambdaExpr(env, exprList.slice(1));
}

function lambda_eval(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));
  if (opt instanceof Lambda_Procedure) {
    return evalProcedureValue(
      env,
      opt.argNames,
      opt.body as Expr[],
      opt.require_new_env_when_eval,
      ...parameters
    );
  } else {
    return new Error("invalid use of procedure");
  }
}

function _displayFuncDepth(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  return new IntNumber(env.functionDepth);
}

const expression_operators: { [key: string]: Function } = {
  quote: quote,
  bind: bind,
  update: update_var,
  define: define_var,
  "set!": define_var,
  lambda: lambda_func,
  lambda_eval: lambda_eval,
  if: if_func,
  while: while_func,
  _displayFuncDepth: _displayFuncDepth,
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
