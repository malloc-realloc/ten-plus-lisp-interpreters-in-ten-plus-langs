// builtins.ts
import {
  Obj,
  IntNumber,
  FloatNumber,
  Bool,
  Procedure,
  TRUE,
  FALSE,
  None_Obj,
  ExprObj,
  ObjType,
  String_Obj,
  Error,
  List_Obj,
} from "./obj";
import { Env } from "./env";
import { Expr, ExprType } from "./ast";
import { evalExpr } from "./eval";

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
    return new String_Obj(new Expr(ExprType.STRING_EXPR, result));
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

export function lambda_func(env: Env, ...args: any[]): void {
  // Keyword lambda is processed in a different way in eval.ts
}

export function define_var(env: Env, key: Obj, value: Obj): Obj {
  env.set(key.value, value);
  return value;
}

export function quote(env: Env, expr: Expr): Obj {
  return new ExprObj(expr);
}

export function eval_expr_obj(env: Env, expr: ExprObj): Obj {
  return evalExpr(env, expr.value);
}

export function set_var(env: Env, key: Obj, value: Obj): Obj {
  if (!env.has(key.value)) {
    return None_Obj;
  } else {
    env.set(key.value, value);
    return value;
  }
}

export function if_func(env: Env, ...args: Obj[]): Obj {
  if (args[0] !== FALSE && args[0] !== None_Obj) {
    return args[1];
  } else if (args.length === 2) {
    return None_Obj;
  } else if (args.length === 3) {
    return args[2];
  } else {
    return None_Obj;
  }
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
  obj0: IntNumber,
  obj1: List_Obj
): Obj {
  if (obj0.value < 0) {
    return new Error(`index must be positive`);
  }

  if (obj1.value.length <= obj0.value) {
    return new Error(
      `index ${obj0.value} must be smaller than length of list ${obj1.value.le_objs}`
    );
  }

  return obj1.value[obj0.value];
}

export function set_container(
  env: Env,
  obj0: IntNumber,
  value: Obj,
  obj1: List_Obj
): Obj {
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
}

export function push_into_container(env: Env, value: Obj, obj1: List_Obj): Obj {
  obj1.value.push(value);
  return value;
}

export const builtin_procedures: { [key: string]: Function } = {
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
  define: define_var,
  display: display,
  begin: begin,
  lambda: lambda_func,
  if: if_func,
  "set!": set_var,
  quote: quote,
  eval: eval_expr_obj,
  cdr: cdr,
  car: car,
  cons: cons,
  list: list_obj,
  get: get_from_container,
  set: set_container,
  push: push_into_container,
};

export const builtin_vars: { [key: string]: Bool } = {
  "#t": TRUE,
  "#f": FALSE,
};
