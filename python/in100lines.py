from curses.ascii import isalnum, isalpha, isspace
import operator


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


builtins = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "/": operator.truediv,
}


def evalExpr(i: int, expr: str) -> tuple[int, float]:
    i, tok = getNextWord(i, expr)
    if tok == "(":
        i, out = evalExpr(i, expr)
        i, tok = getNextWord(i, expr)  # skip ")"
        return i, out
    if tok.isdigit():
        return i, float(tok)
    if tok in builtins:
        opt = builtins[tok]
        numbers = []
        while tok != ")":
            i, out = evalExpr(i, expr)
            numbers.append(out)
            _, tok = getNextWord(i, expr)
        out = 0
        for n in numbers:
            out = opt(out, n)
        return i, out


while True:
    envDict = {}
    expr: str = input("pyLisp> ")
    if expr == "exit":
        break
    i = 0
    while i < len(expr):
        i, out = evalExpr(i, expr)
        print(out)
