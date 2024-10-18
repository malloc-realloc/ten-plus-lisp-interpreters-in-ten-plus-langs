import array
from curses.ascii import isspace
import operator

Lisp_Env = {}


class Obj:
    def __init__(self, type, value) -> None:
        self.type = type
        self.value = value


# get current word, move pointer(i) to the beginning of next word
def getNextWord(i: int, expr: str) -> tuple[int, str]:
    while i < len(expr) and isspace(expr[i]):
        i += 1
    if expr[i] == ")" or expr[i] == "(":
        out = expr[i]
        i += 1
        return i, out
    s = ""
    while (
        i < len(expr)
        and not isspace(expr[i])
        and not (expr[i] == "(" or expr[i] == ")")
    ):
        s += expr[i]
        i += 1
    return i, s


def skipExpr(i, expr) -> tuple[int, str]:
    _, tok = getNextWord(i, expr)
    if tok != "(":
        i, out = getNextWord(i, expr)
        return i, out
    else:
        l_minus_r = 1
        i, out = getNextWord(i, expr)
        while l_minus_r != 0:
            i, out = getNextWord(i, expr)
            if out == "(":
                l_minus_r += 1
            elif out == ")":
                l_minus_r -= 1
        return i, out


addSubMulDiv = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "/": operator.truediv,
}


def ifFunc(i: int, expr: str) -> tuple[int, Obj]:
    i, cond = evalExpr(i, expr)
    if cond.value:
        i, out = evalExpr(i, expr)
        _, nextTok = getNextWord(i, expr)
        if nextTok == ")":
            return i, out
        i, _ = skipExpr(i, expr)
        return i, out
    else:
        i, _ = skipExpr(i, expr)
        i, out = evalExpr(i, expr)
        return i, out


def defineFunc(i: int, expr: str) -> tuple[int, Obj]:
    i, tok = getNextWord(i, expr)
    i, out = evalExpr(i, expr)
    Lisp_Env[tok] = out
    return i, out


def returnLambdaObjFunc(i: int, expr: str) -> tuple[int, Obj]:
    i, tok = getNextWord(i, expr)  # skip "("
    params = []
    while tok != ")":
        i, tok = getNextWord(i, expr)
        if tok == ",":
            continue
        params.append(tok)

    start = i
    j = i
    prev = i
    _, tok = getNextWord(j, expr)
    while tok != ")":
        j, _ = skipExpr(j, expr)
        _, tok = getNextWord(j, expr)
    i = j

    out = Obj("lambda", expr[start:j])
    return i, out


builtins = {
    "if": ifFunc,
    "define": defineFunc,
    "lambda": returnLambdaObjFunc,
}


def evalExpr(i: int, expr: str) -> tuple[int, Obj]:
    i, tok = getNextWord(i, expr)
    if tok == "(":
        i, out = evalExpr(i, expr)
        i, tok = getNextWord(i, expr)  # skip ")"
        return i, out
    if tok.isdigit():
        return i, Obj("float", float(tok))
    if tok in addSubMulDiv:
        opt = addSubMulDiv[tok]
        numberObjs = []
        while tok != ")":
            i, out = evalExpr(i, expr)
            numberObjs.append(out)
            _, tok = getNextWord(i, expr)
        out = 0
        for n in numberObjs:
            out = opt(out, n.value)
        return i, Obj("float", out)
    if tok in builtins:
        return builtins[tok](i, expr)
    if tok in Lisp_Env:
        return i, Lisp_Env[tok]


while True:
    envDict = {}
    expr: str = input("pyLisp> ")
    if expr == "exit":
        break
    i = 0
    while i < len(expr):
        i, out = evalExpr(i, expr)
        print(out.value)
