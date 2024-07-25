from pylisp_repl import repl
from pylisp_token import tokenize
from pylisp_parser import parse_expr
from pylisp_eval import eval
from pylisp_env import Env

# repl()
global_env = Env()


def eval_expr(expr: str):
    tokenized_expr = tokenize(expr)
    ast = parse_expr(tokenized_expr)
    result = eval(global_env, ast)
    return result


exprs = [
    "((lambda (x) (+ x 1)) 2)",
    "(define f (lambda (x) (+ 2 x)))",
    "(f 4)",
    "(define higher_level_function (lambda (x) (lambda (y) (+  y x))))",
    "(define add2 (higher_level_function 2))",
    "(add2 4)",
    "(define r 2)",
    "(define with_r_2 (lambda (x) (+ r x)))",
    "(with_r_2 10)",
    "(define r 10)",
    "(with_r_2 10)",
    "(if (> -1 0) 2 1)",
    "(if 0 2 1)",  # 0 is consider as TRUE
    "(define r 10)",
    "(set! r 2)",
    "(define e (quote + 1 2))",
    "(eval e)",
    "(define qe (quote 1))",
    "(eval qe)",
    "(eval (car `(1)))",
    "(eval (car `(1 1 1 )))",
    "(eval (cdr `(1 + 1 1)))",
    "(eval (car `((+ 1  1)) ))",
    "(cdr (quote 1 2 3))",
    "(cons `1 `(1 1))",
    "(cons (quote +) `(1 1 ))",
    "(cons `+ `(1 1))",
    "(define 世界 1)",
    "(display 世界)",
    "(define temp (cons `a `(1 1)))",
    "(cons `(a b) `(b c d))",
    "(cons `(a b) `c)",
    "(cons `a `3)",
    "(define shit (quote + 1 1))",
    "(eval shit)",
]

results = []

for expr in exprs:
    results.append(eval_expr(expr).value)
