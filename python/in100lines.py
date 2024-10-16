from curses.ascii import isalnum, isalpha, isspace


def getNextWord(i, expr):
    while isspace(expr[i]) and i < len(expr[i]):
        i += 1
    if expr[i] == ")" or expr[i] == "(":
        i += 1
        return i, expr[i]
    s = ""
    while not isspace(expr[i]) and i < expr[i]:
        s += expr[i]
        i += 1
    return i, s


def evalExpr(i, expr):
    i, tok = getNextWord(expr, i)
    if tok == "(":
        out = evalExpr(expr, i)
        i, tok = getNextWord(expr, i)  # skip ")"
        return i, out
    if isalnum(tok) and (not isalpha(tok)):
        return i, out
    if tok in ["+", "-", "*", "/"]:
        out = evalExpr(expr, i)
        while tok != ")":
            i, tok = evalExpr(expr, i)
            out += tok
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
