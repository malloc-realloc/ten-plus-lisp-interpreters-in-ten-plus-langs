# This is a scheme interpreter in python. My original code is hugely refactored (in a good way) by Claude 3.5 Sonnet and I really appreciate its "insights" and style.
import operator
from functools import reduce


class Env(dict):
    def __init__(self, parms=(), args=(), outer=None):
        self.update(zip(parms, args))
        self.outer = outer

    def find(self, var):
        return self if var in self else self.outer.find(var)


def parse(program):
    return read(program.replace("(", " ( ").replace(")", " ) ").split())


def read(tokens):
    if len(tokens) == 0:
        raise SyntaxError("unexpected EOF")
    token = tokens.pop(0)
    if token == "(":
        L = []
        while tokens[0] != ")":
            L.append(read(tokens))
        tokens.pop(0)  # pop off ')'
        return L
    elif token == ")":
        raise SyntaxError("unexpected )")
    else:
        try:
            return int(token)
        except ValueError:
            try:
                return float(token)
            except ValueError:
                return str(token)


def evaluate(x, env):
    if isinstance(x, str):  # variable reference
        return env.find(x)[x]
    elif not isinstance(x, list):  # constant literal
        return x
    op, *args = x
    if op == "quote":  # quotation
        return args[0]
    elif op == "if":  # conditional
        (test, conseq, alt) = args
        exp = conseq if evaluate(test, env) else alt
        return evaluate(exp, env)
    elif op == "define":  # definition
        (symbol, exp) = args
        env[symbol] = evaluate(exp, env)
    elif op == "lambda":  # procedure
        (parms, body) = args
        return lambda *args: evaluate(body, Env(parms, args, env))
    else:  # procedure call
        proc = evaluate(op, env)
        vals = [evaluate(arg, env) for arg in args]
        return proc(*vals)


def repl(prompt="pyLisp> "):
    global_env = Env()
    global_env.update(
        {
            "+": lambda *args: reduce(operator.add, args),
            "-": lambda *args: reduce(operator.sub, args),
            "*": lambda *args: reduce(operator.mul, args),
            "/": lambda *args: reduce(operator.truediv, args),
            ">": operator.gt,
            "<": operator.lt,
            ">=": operator.ge,
            "<=": operator.le,
            "=": operator.eq,
            "abs": abs,
            "append": operator.add,
            "apply": lambda proc, args: proc(*args),
            "begin": lambda *x: x[-1],
            "car": lambda x: x[0],
            "cdr": lambda x: x[1:],
            "cons": lambda x, y: [x] + y,
            "eq?": operator.is_,
            "equal?": operator.eq,
            "length": len,
            "list": lambda *x: list(x),
            "list?": lambda x: isinstance(x, list),
            "map": map,
            "max": max,
            "min": min,
            "not": operator.not_,
            "null?": lambda x: x == [],
            "number?": lambda x: isinstance(x, (int, float)),
            "procedure?": callable,
            "round": round,
            "symbol?": lambda x: isinstance(x, str),
        }
    )
    while True:
        try:
            val = evaluate(parse(input(prompt)), global_env)
            if val is not None:
                print(lisp_str(val))
        except Exception as e:
            print(f"{type(e).__name__}: {e}")


def lisp_str(exp):
    if isinstance(exp, list):
        return "(" + " ".join(map(lisp_str, exp)) + ")"
    else:
        return str(exp)


if __name__ == "__main__":
    repl()
