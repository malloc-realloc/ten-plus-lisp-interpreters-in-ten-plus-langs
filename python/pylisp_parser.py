from pylisp_ast import *


# parse_expr: transform list[str] into Expr
def parse_expr(tokens: list[str]) -> Expr:

    token = tokens[0]
    tokens.pop(0)
    if token == "(":
        lst_expr = []
        while token != ")":
            expr = parse_expr(tokens)
            lst_expr.append(expr)
            token = tokens[0]
        tokens.pop(0)
        return Expr(ExprType.LST_EXPR, lst_expr)

    else:
        return Expr(ExprType.ATOM, Atom(token))
