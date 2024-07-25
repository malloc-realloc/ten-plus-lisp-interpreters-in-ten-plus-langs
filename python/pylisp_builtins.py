from copy import deepcopy
from pylisp_obj import *
from pylisp_env import *
import os


def add_objs(env: Env, *args: Number) -> Number:
    result = 0
    for arg in args:
        result += arg.value
    if isinstance(result, int):
        return IntNumber(result)
    else:
        return FloatNumber(result)


def sub_objs(env: Env, *args: Number) -> Number:
    result = args[0].value
    for arg in args[1:]:
        result -= arg.value
    if isinstance(result, int):
        return IntNumber(result)
    else:
        return FloatNumber(result)


def mul_objs(env: Env, *args: Number) -> Number:
    result = 1
    for arg in args:
        result *= arg.value
    if isinstance(result, int):
        return IntNumber(result)
    else:
        return FloatNumber(result)


def div_objs(env: Env, *args: Number) -> Number:
    result = args[0].value
    for arg in args[1:]:
        result /= arg.value
    if result.is_integer():
        return IntNumber(int(result))
    else:
        return FloatNumber(result)


def gt_objs(env: Env, arg1: Number, arg2: Number) -> Bool:
    if arg1.value > arg2.value:
        return TRUE
    else:
        return FALSE


def lt_objs(env: Env, arg1: Number, arg2: Number) -> Bool:
    if arg1.value < arg2.value:
        return TRUE
    else:
        return FALSE


def ge_objs(env: Env, arg1: Number, arg2: Number) -> Bool:
    if arg1.value >= arg2.value:
        return TRUE
    else:
        return FALSE


def le_objs(env: Env, arg1: Number, arg2: Number) -> Bool:
    if arg1.value <= arg2.value:
        return TRUE
    else:
        return FALSE


def eq_objs(env: Env, arg1: Obj, arg2: Obj) -> Bool:
    if arg1.value == arg2.value:
        return TRUE
    else:
        return FALSE


def abs_obj(env: Env, arg: Number) -> Number:
    result = abs(arg.value)
    if isinstance(result, int):
        return IntNumber(result)
    else:
        return FloatNumber(result)


def lambda_func(env: Env, *args):
    pass


def define_var(env: Env, key: Obj, value: Obj) -> Obj:
    # Work on env directly, store Obj-type element in env
    env[key.value] = value

    return value


def quote(env: Env, expr: Expr) -> Obj:
    return Expr_Obj(value=expr)


def eval_expr_obj(env: Env, expr: Expr_Obj) -> Obj:
    from pylisp_eval import eval

    return eval(env, expr.value)


def set_var(env: Env, key: Obj, value: Obj) -> Obj:
    "The only difference between set! and define is that set! can not create new variable in current env."

    if not key.value in env.keys():
        return None_Obj
    else:
        env[key.value] = value
        return value


def if_func(env: Env, *args) -> Obj:
    "If predicate is not FALSE or NONE, we consider it to be true"
    if args[0] != FALSE and args[0] != None_Obj:
        return args[1]
    elif len(args) == 2:
        return None_Obj
    elif len(args) == 3:
        return args[2]
    else:
        return None_Obj


def display(env: Env, *args: Obj) -> Obj:
    for arg in args:
        print(arg.value)

    return args[-1]


def begin(env: Env, *args: Obj) -> Obj:
    return args[-1]


def end_procedure(*args):
    os._exit(0)


def cdr(env: Env, expr_obj: Expr_Obj) -> Expr_Obj:
    return Expr_Obj(value=Expr(ExprType.LST_EXPR, expr_obj.value.literal[1:]))


def car(env: Env, expr_obj: Expr_Obj) -> Expr_Obj:
    "When coping with atom in Expr_obj, there are many literals involved!"
    if expr_obj.value.type == ExprType.ATOM:
        return Expr_Obj(value=Expr(ExprType.ATOM, expr_obj.value.literal))
    else:
        if expr_obj.value.literal[0].type == ExprType.ATOM:
            return Expr_Obj(
                value=Expr(ExprType.ATOM, expr_obj.value.literal[0].literal)
            )
        else:
            return Expr_Obj(
                value=Expr(ExprType.LST_EXPR, expr_obj.value.literal[0].literal)
            )


def cons(env: Env, obj0: Expr_Obj, obj1: Expr_Obj) -> Expr_Obj:
    "if obj1 is a quote of a list, then returns (obj1 *obj2); if obj1 is an atom, then returns (obj1 obj2)"
    if obj1.value.type == ExprType.LST_EXPR:
        new_obj = deepcopy(obj1.value.literal)
        new_obj.insert(0, Expr(obj0.value.type, obj0.value.literal))
        return Expr_Obj(value=Expr(ExprType.LST_EXPR, new_obj))
    else:
        return Expr_Obj(
            value=Expr(
                ExprType.LST_EXPR,
                [Expr(obj0.value.type, obj0.value.literal), obj1.value.literal],
            )
        )


builtin_procedures = {
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
}

builtin_vars = {"#t": Bool(True), "#f": Bool(False)}
# "append": op.add,
# "apply": lambda proc, args: proc(*args),  # *解包
# "begin": lambda *x: x[-1],  # *打包
# "car": lambda x: x[0],
# "cdr": lambda x: x[1:],
# "cons": lambda x, y: [x] + y,
# "eq?": op.is_,
# "expt": pow,
# "equal?": op.eq,
# "length": len,
# "list": lambda *x: List(x),
# "list?": lambda x: isinstance(x, List),
# "map": map,
# "max": max,
# "min": min,
# "not": op.not_,
# "null?": lambda x: x == [],
# "number?": lambda x: isinstance(x, IntNumber) | isinstance(x, FloatNumber),
# "print": print,
# "procedure?": callable,
# "round": round,
# "symbol?": lambda x: isinstance(x, Atom),
