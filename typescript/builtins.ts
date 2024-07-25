// builtins.ts
import { Obj, IntNumber, FloatNumber, Bool, Procedure, TRUE, FALSE, None_Obj, ExprObj, ObjType } from './obj';
import { Env } from './env';
import { Expr, ExprType } from './ast';
import {evalExpr} from "./eval"

type Number = IntNumber | FloatNumber;

export function add_objs(env: Env, ...args: Number[]): Number {
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
    for (const arg of args) {
        console.log(arg.value);
    }
    return args[args.length - 1];
}

export function begin(env: Env, ...args: Obj[]): Obj {
    return args[args.length - 1];
}

export function end_procedure(...args: any[]): void {
    // do nothing
}

export function cdr(env: Env, expr_obj: ExprObj): ExprObj {
    return new ExprObj(new Expr(ExprType.LST_EXPR, expr_obj.value.literal.slice(1)));
}

export function car(env: Env, expr_obj: ExprObj): ExprObj {
    if (expr_obj.value.type === ExprType.ATOM) {
        return new ExprObj(new Expr(ExprType.ATOM, expr_obj.value.literal));
    } else {
        if (expr_obj.value.literal[0].type === ExprType.ATOM) {
            return new ExprObj(new Expr(ExprType.ATOM, expr_obj.value.literal[0].literal));
        } else {
            return new ExprObj(new Expr(ExprType.LST_EXPR, expr_obj.value.literal[0].literal));
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
        return new ExprObj(new Expr(ExprType.LST_EXPR, [new Expr(obj0.value.type, obj0.value.literal), obj1.value.literal]));
    }
}

export const builtin_procedures: { [key: string]: Function } = {
    "exit": end_procedure,
    "+": add_objs,
    "-": sub_objs,
    "*": mul_objs,
    "/": div_objs,
    ">": gt_objs,
    "<": lt_objs,
    ">=": ge_objs,
    "<=": le_objs,
    "=": eq_objs,
    "abs": abs_obj,
    "define": define_var,
    "display": display,
    "begin": begin,
    "lambda": lambda_func,
    "if": if_func,
    "set!": set_var,
    "quote": quote,
    "eval": eval_expr_obj,
    "cdr": cdr,
    "car": car,
    "cons": cons,
};

export const builtin_vars: { [key: string]: Bool } = {
    "#t": TRUE,
    "#f": FALSE,
};
