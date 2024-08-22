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
  Class_Obj,
} from "./obj";
import { Env } from "./env";
import { Expr, ExprType } from "./ast";
import { evalExpr } from "./eval";
import { handleError } from "./commons";
import { Instance_Obj } from "./obj";

type Number = IntNumber | FloatNumber;

type NumberOrString = Number | String_Obj;

export function add_objs(env: Env, ...args: NumberOrString[]): Obj {
  try {
    if (args.length === 0) {
      throw new Error("At least one argument is required");
    }

    if (args[0].type === ObjType.STRING_OBJ) {
      const result = (args as String_Obj[]).reduce(
        (acc, arg) => acc + arg.value.literal,
        ""
      );
      return new String_Obj(result);
    } else {
      const result = (args as Number[]).reduce(
        (acc, arg) => acc + arg.value,
        0
      );
      return Number.isInteger(result)
        ? new IntNumber(result)
        : new FloatNumber(result);
    }
  } catch (error) {
    return handleError(env, "+", error);
  }
}

export function sub_objs(env: Env, ...args: Number[]): Obj {
  try {
    let result = args[0].value;
    for (const arg of args.slice(1)) {
      result -= arg.value;
    }
    if (Number.isInteger(result)) {
      return new IntNumber(result);
    } else {
      return new FloatNumber(result);
    }
  } catch (error) {
    env.setErrorMessage("-");
    return new Error("-");
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
    return new Error("*");
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
    return new Error("str");
  }
}

export function div_objs(env: Env, ...args: Number[]): Obj {
  try {
    let result = args[0].value;
    for (const arg of args.slice(1)) {
      if (arg.value === 0) {
        throw new Error("Division by zero");
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
    return new Error("/");
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
    return new Error("list");
  }
}

export function dict_obj(env: Env, ...args: Obj[]): Obj {
  try {
    let obj = new Dict_Obj({});
    for (const [index, value] of args.entries()) {
      if (index % 2 === 0) {
        if (args[index].type !== ObjType.STRING_OBJ) {
          throw new Error("key must be string");
        }
        obj.value[args[index].value] = args[index + 1];
      } else {
        continue;
      }
    }
    return obj;
  } catch (error) {
    env.setErrorMessage("dict");
    return new Error("dict");
  }
}

export function gt_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value > arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage(">");
    return new Error(">");
  }
}

export function lt_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value < arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage("<");
    return new Error("<");
  }
}

export function ge_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value >= arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage(">=");
    return new Error(">=");
  }
}

export function le_objs(env: Env, arg1: Number, arg2: Number): Obj {
  try {
    return arg1.value <= arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage("<=");
    return new Error("<=");
  }
}

export function eq_objs(env: Env, arg1: Obj, arg2: Obj): Obj {
  try {
    return arg1.value === arg2.value ? TRUE : FALSE;
  } catch (error) {
    env.setErrorMessage("=");
    return new Error("=");
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
    return new Error("abs");
  }
}

export function eval_expr_obj(env: Env, expr: ExprObj): Obj {
  try {
    return evalExpr(env, expr.value);
  } catch (error) {
    env.setErrorMessage("eval");
    return new Error("eval");
  }
}

export function display(env: Env, ...args: Obj[]): Obj {
  try {
    if (
      args[0].type === ObjType.STRING_OBJ ||
      args[0].type === ObjType.LLM_EXPR_OBJ
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
    return new Error("display");
  }
}

export function begin(env: Env, ...args: Obj[]): Obj {
  try {
    return args[args.length - 1];
  } catch (error) {
    env.setErrorMessage("begin");
    return new Error("begin");
  }
}

export function cdr(env: Env, expr_obj: ExprObj): Obj {
  try {
    return new ExprObj(
      new Expr(ExprType.LST_EXPR, expr_obj.value.literal.slice(1))
    );
  } catch (error) {
    env.setErrorMessage("cdr");
    return new Error("cdr");
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
    return new Error("car");
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
    return new Error("cons");
  }
}

export function defineClass(
  env: Env,
  className: String_Obj,
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
  ...args: String_Obj[]
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
  obj0: IntNumber | String_Obj,
  obj1: List_Obj | Dict_Obj
): Obj {
  try {
    if (obj1.type === ObjType.LIST_OBJ) {
      if (obj0.value < 0) {
        throw new Error("index must be positive");
      }
      if (obj1.value.length <= obj0.value) {
        throw new Error(
          `index ${obj0.value} must be smaller than length of list ${obj1.value.length}`
        );
      }
      return obj1.value[obj0.value];
    } else if (obj1.type === ObjType.DICT_OBJ) {
      if (obj1.value.hasOwnProperty(obj0.value)) {
        return obj1.value[obj0.value];
      } else {
        throw new Error(`key ${obj0.value} not found in dictionary`);
      }
    }
    throw new Error("Invalid usage of get");
  } catch (error) {
    env.setErrorMessage("get");
    return new Error("get");
  }
}

export function set_container(
  env: Env,
  obj0: IntNumber | String_Obj,
  value: Obj,
  obj1: List_Obj | Dict_Obj
): Obj {
  try {
    if (obj1.type === ObjType.LIST_OBJ) {
      if (obj0.value < 0) {
        throw new Error("index must be positive");
      }
      if (obj1.value.length <= obj0.value) {
        throw new Error(
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
        throw new Error(`key ${obj0.value} not found in dictionary`);
      }
    }
  } catch (error) {
    env.setErrorMessage("set");
    return new Error("set");
  }
}

export function push_into_container(env: Env, value: Obj, obj1: List_Obj): Obj {
  try {
    obj1.value.push(value);
    return value;
  } catch (error) {
    env.setErrorMessage("push");
    return new Error("push");
  }
}

export function set_llm(env: Env, value: String_Obj): Obj {
  try {
    env.set("llm", value);
    return value;
  } catch (error) {
    env.setErrorMessage("llm");
    return new Error("llm");
  }
}

export function random_func(env: Env, arg1: Obj, arg2: Obj): Obj {
  try {
    const n1 = arg1.value;
    const n2 = arg2.value;
    const min = Math.min(n1, n2);
    const max = Math.max(n1, n2);
    const result = new IntNumber(Math.random() * (max - min) + min);
    return result;
  } catch (error) {
    env.setErrorMessage("random");
    return new Error("random");
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
    return new Error("randint");
  }
}

export function randchoice(env: Env, ...args: Obj[]): Obj {
  try {
    const l = args.length;
    const i = Math.floor(Math.random() * l);
    return args[i];
  } catch (error) {
    env.setErrorMessage("randchoice");
    return new Error("randchoice");
  }
}

export function returnFunc(env: Env, arg: Obj): Obj {
  try {
    env.functionDepth--;
    return arg;
  } catch (error) {
    env.setErrorMessage("return");
    return new Error("return");
  }
}

export function geti(
  env: Env,
  instance_obj: Instance_Obj,
  name: String_Obj
): Obj {
  const obj = instance_obj.value.get(name.value);

  return obj;
}

export function set_method(
  env: Env,
  class_obj: Class_Obj,
  name: String_Obj,
  procedure: Procedure
): Obj {
  env.classes.get(class_obj.value)?.set(name.value, procedure);

  return procedure;
}

export function call_method(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));

  const instance = parameters[0] as Instance_Obj;
  const methodName = parameters[1] as String_Obj;

  env.newThis(instance.instanceName, instance);

  const procedure: Procedure = env.classes
    .get(instance.className)
    ?.get(methodName.value) as Procedure;

  const obj: Obj = lambda_eval(env, procedure, exprList.slice(2));

  env.popThis();

  return obj;
}

export function defineClassInstance(
  env: Env,
  class_obj: Class_Obj,
  name: String_Obj
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
  name: String_Obj,
  obj: Obj
): Obj {
  instance_obj.value.set(name.value, obj);

  return obj;
}

export function end_procedure(...args: any[]): void {
  // do nothing
}

export const builtin_vars: { [key: string]: Bool } = {
  "#t": TRUE,
  "#f": FALSE,
};

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
  class: defineClass,
  instance: defineClassInstance,
  geti: geti,
  seti: seti,
  setm: set_method,
  subclass: defineSubClass,
};

function quote(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
    if (exprList.length === 2 && exprList[1].type === ExprType.ATOM) {
      return new ExprObj(new Expr(ExprType.ATOM, exprList[1].literal));
    } else {
      return new ExprObj(new Expr(ExprType.LST_EXPR, exprList.slice(1)));
    }
  } catch (error) {
    env.setErrorMessage("quote");
    return new Error("quote");
  }
}

function bind(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
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
  } catch (error) {
    env.setErrorMessage("bind");
    return new Error("bind");
  }
}

function atomAsEnvKey(expr: Expr): Obj {
  return new Obj(expr.literal, ObjType.NONE);
}

function evalProcedureValue(
  bodyEnv: Env,
  argNames: Expr[],
  body: Expr[],
  require_new_env_when_eval: Boolean,
  ...args: any[]
): Obj {
  try {
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
  } catch (error) {
    bodyEnv.setErrorMessage("evalProcedureValue");
    return new Error("evalProcedureValue");
  }
}

function update_var(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
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
  } catch (error) {
    env.setErrorMessage("update_var");
    return new Error("update_var");
  }
}

function define_var(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
    const parameters = [atomAsEnvKey(exprList[1]), evalExpr(env, exprList[2])];
    env.set(parameters[0].value, parameters[1]);
    return parameters[1];
  } catch (error) {
    env.setErrorMessage("define_var");
    return new Error("define_var");
  }
}

export function if_func(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
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
  } catch (error) {
    env.setErrorMessage("if");
    return new Error("if");
  }
}

export function while_func(env: Env, opt: Procedure, exprList: Expr[]): Obj {
  try {
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
  } catch (error) {
    env.setErrorMessage("while");
    return new Error("while");
  }
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
  callm: call_method,
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
