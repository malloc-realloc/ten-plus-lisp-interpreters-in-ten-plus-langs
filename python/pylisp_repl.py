from pylisp_token import *
from pylisp_parser import *
from pylisp_eval import *
from pylisp_env import Env


def repl():
    global_env = Env()
    while True:
        expr = input("pylisp> ")
        tokenized_expr = tokenize(expr)
        ast = parse_expr(tokenized_expr)

        resulted_obj = eval(global_env, ast)

        result = str(resulted_obj.value)

        print(result)
