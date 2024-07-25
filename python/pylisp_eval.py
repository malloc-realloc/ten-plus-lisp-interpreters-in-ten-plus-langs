from pylisp_ast import *
from pylisp_obj import *
from pylisp_env import Env
from pylisp_builtins import builtin_procedures, builtin_vars
from copy import deepcopy


def eval(env: Env, expr: Expr) -> Obj:
    if expr.type == ExprType.ATOM:
        return eval_atom(env, expr)
    else:
        return eval_lst_expr(env, expr)


def eval_lst_expr(env: Env, expr: Expr) -> Obj:
    # list[pylisp_ast.Expr, ...]
    expr_lst = expr.literal

    # get operator. If the first expr in current lst_expr is an Atom, then we use the first element of this lst_expr as operator. if not, we evaluate the first expr to get the operator
    first_expr = expr_lst[0]

    try:

        if first_expr.type == ExprType.ATOM:
            opt: Procedure = eval_atom(env, first_expr)
        else:
            opt = eval_lst_expr(env, first_expr)

        if opt.type != ObjType.PROCEDURE:
            raise ValueError(
                f"Invalid procedure: {first_expr.literal} is not an operator."
            )

        if opt.name == "quote":
            if len(expr_lst[1:]) == 1 and expr_lst[1].type == ExprType.ATOM:
                return opt.value(env, Expr(ExprType.ATOM, expr_lst[1].literal))

            else:
                return opt.value(env, Expr(ExprType.LST_EXPR, expr_lst[1:]))

        if opt.name in ["define", "set!"]:
            parameters = [atom_as_env_key(expr_lst[1]), eval(env, expr_lst[2])]
        elif opt.name == "lambda":
            # In this interpreter, when opt is lambda, opt is not used. Instead, we use eval_lambda_expr to get Procedure
            return eval_lambda_expr(env, expr_lst[1:])
        else:
            parameters = [eval(env, expr) for expr in expr_lst[1:]]

        # By code as data, procedure of opt is stored in its value field
        return opt.value(env, *parameters)

    except Exception as e:
        # Handle other exceptions
        print(f"An error occurred: {str(e)}")
        # You might want to re-raise the exception or return a specific error object
        raise
        return Error(f"An error occurred: {str(e)}")


def eval_lambda_expr(env: Env, expr_lst: list[Expr]) -> Procedure:
    "eval_lambda_expr: When a lambda function is declared, no matter in an 'define expr', or as an operator of expr, it returns a Procedure with value of a function. This function has a bounded args_names, body(exprs), body_env"
    # e.g. (lambda (x) (+ x 1) ) arg_names.literal[0].literal == 'x'
    arg_names: list[Atom] = expr_lst[
        0
    ]  # list[Atom], for example (x) in (lambda (x) (+ x 1))
    body: list[Expr] = expr_lst[1:]  # for example (+ x 1) in (lambda (x) (+ x 1))
    body_env = deepcopy(
        env
    )  # this environment is bound to lambda function when the func is declared. If we don't use deepcopy here, there is no binding.

    def procedure_value(env, *args):
        # bind parameter values to free variables in function parameter list
        if len(args) != len(arg_names.literal):
            print("Error: Invalid number of arguments")
        working_env = deepcopy(body_env)  # working_env is independent of body_env
        for arg, arg_name in zip(args, arg_names.literal):
            working_env[arg_name.literal] = arg

        # eval body
        for expr in body:
            result = eval(working_env, expr)

        return result

    return Procedure(value=procedure_value, name="lambda_eval")


def atom_as_env_key(expr: Expr) -> Obj:
    "atom_as_env_key is used when adding and updating key-value pair in environment. It does not evaluate the expr."
    return Obj(expr.literal, ObjType.NONE)


def eval_atom(env: Env, expr: Expr) -> Obj:
    literal = expr.literal

    if is_int(literal):
        return IntNumber(int(literal))
    elif is_float(literal):
        return FloatNumber(float(literal))
    elif is_builtin(literal):
        return get_builtin(literal)
    else:
        return get_from_env(env, literal)


def get_from_env(env: Env, literal: str) -> Obj:
    if literal in env.keys():
        return env[literal]
    else:
        print("Error: retrieve undefined variable %s from environment")
        return None_Obj


def is_int(s: Atom) -> bool:
    try:
        int(s)
        return True
    except ValueError:
        return False


def is_float(s: Atom) -> bool:
    try:
        float(s)
        return True
    except ValueError:
        return False


def is_procedure(s: Atom) -> bool:
    try:
        pass
    except:
        pass


def is_builtin(s: Atom) -> bool:
    if str(s) in builtin_procedures.keys() | builtin_vars.keys():
        return True
    else:
        return False


def get_builtin(s: Atom) -> Procedure:
    if s in builtin_procedures:
        return Procedure(value=builtin_procedures[s], name=s)
    else:
        return get_builtin_vars(s)


def get_builtin_vars(s: Atom) -> Obj:
    return builtin_vars[s]
