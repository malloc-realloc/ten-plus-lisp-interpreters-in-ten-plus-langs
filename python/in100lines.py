from copy import deepcopy
import operator
from curses.ascii import isspace


class Obj:
    def __init__(self, type, value) -> None:
        self.type = type
        self.value = value


class Env:
    def __init__(self, father=None) -> None:
        self.value = {}
        self.father = father
        self.end = False

    def inEnv(self, tok: str):
        if tok in self.value:
            return True
        elif self.father is not None:
            return self.father.inEnv(tok)
        else:
            return False

    def get(self, tok: str):
        if tok in self.value:
            return self.value[tok]
        elif self.father is not None:
            return self.father.get(tok)
        else:
            raise KeyError(f"Token '{tok}' not found in environment or its ancestors")

    def set(self, tok: str, obj: Obj):
        self.value[tok] = obj
        return obj


def getNextWord(i: int, expr: str) -> tuple[int, str]:
    while i < len(expr) and isspace(expr[i]):
        i += 1
    if i < len(expr) and (expr[i] == ")" or expr[i] == "("):
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


def ifFunc(env, i: int, expr: str) -> tuple[int, Obj]:
    i, cond = evalExpr(env, i, expr)
    if cond.value:
        i, out = evalExpr(env, i, expr)
        _, nextTok = getNextWord(i, expr)
        if nextTok == ")":
            return i, out
        i, _ = skipExpr(i, expr)
        return i, out
    else:
        i, _ = skipExpr(i, expr)
        i, out = evalExpr(env, i, expr)
        return i, out


def defineFunc(env, i: int, expr: str) -> tuple[int, Obj]:
    i, tok = getNextWord(i, expr)
    i, out = evalExpr(env, i, expr)
    env.set(tok, out)
    return i, out


def returnLambdaObjFunc(env, i: int, expr: str) -> tuple[int, Obj]:
    i, tok = getNextWord(i, expr)  # skip "("
    params = []
    while tok != ")":
        i, tok = getNextWord(i, expr)
        if tok == ",":
            continue
        params.append(tok)
    params.pop()  # remove ")"

    start = i
    j = i
    prev = i
    _, tok = getNextWord(j, expr)
    while tok != ")":
        j, _ = skipExpr(j, expr)
        _, tok = getNextWord(j, expr)
    i = j

    out = Obj("lambda", {"expr": expr[start:j], "vars": params})
    return i, out


def returnFunc(env, i: int, expr: str) -> tuple[int, Obj]:
    env.end = True
    i, out = evalExpr(env, i, expr)
    return i, out


builtins = {
    "if": ifFunc,
    "define": defineFunc,
    "lambda": returnLambdaObjFunc,
    "return": returnFunc,
}


def evalExpr(env, i: int, expr: str) -> tuple[int, Obj]:
    i, tok = getNextWord(i, expr)
    if tok == "(":
        i, out = evalExpr(env, i, expr)
        i, tok = getNextWord(i, expr)  # skip ")"
        return i, out
    if tok.isdigit():
        return i, Obj("float", float(tok))
    if tok in addSubMulDiv:
        opt = addSubMulDiv[tok]
        numberObjs = []
        while tok != ")":
            i, out = evalExpr(env, i, expr)
            numberObjs.append(out)
            _, tok = getNextWord(i, expr)
        out = numberObjs[0].value
        for n in numberObjs[1:]:
            out = opt(out, n.value)
        return i, Obj("float", out)
    if tok in builtins:
        return builtins[tok](env, i, expr)
    if env.inEnv(tok):
        if env.get(tok).type != "lambda":
            return i, env.get(tok)
        elif env.get(tok).type == "lambda":
            lambdaFunc = env.get(tok).value  #  {"expr": expr[start:j], "vars": params}
            params = []
            while tok != ")":
                i, out = evalExpr(env, i, expr)
                params.append(out)
                _, tok = skipExpr(i, expr)

            # Save the original values of the variables we're about to override
            newEnv = Env(env)
            for j, param_name in enumerate(lambdaFunc["vars"]):
                newEnv.set(param_name, params[j])

            j = 0
            while j < len(lambdaFunc["expr"]):
                j, out = evalExpr(newEnv, j, lambdaFunc["expr"])
                if newEnv.end:
                    break

            return i, out

    raise ValueError(f"Undefined symbol: {tok}")


def main():
    env = Env()
    while True:
        try:
            expr: str = input("pyLisp> ").strip()
            i = 0
            while i < len(expr):
                i, out = evalExpr(env, i, expr)
                print(out.value)
            if env.end:
                break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
