import { Expr, ExprType, Atom } from "./ast";
import {
  Obj,
  IntNumber,
  FloatNumber,
  Procedure,
  String_Obj,
  ErrorObj,
  Undefined_Obj,
  None_Obj,
} from "./obj";
import { Env } from "./env";
import {
  builtinOpts,
  builtinVars,
  evalExprStartingWithLambdaObj,
  isExprLiteralOpt,
} from "./builtins";
import { handleError } from "./commons";
import { parseExprs } from "./parser";
import { tokenize } from "./token";

export function evalStrExprs(env: Env, s: string): Obj {
  return evalExprs(env, parseExprs(tokenize(env, s)));
}

export function evalExprs(env: Env, exprs: Expr[]): Obj {
  let obj: Obj = None_Obj;
  for (let i = 0; i < exprs.length; i++) {
    obj = evalExpr(env, exprs[i]);
  }
  return obj;
}

export function evalExpr(env: Env, expr: Expr): Obj {
  let result: Obj;
  if (expr.type === ExprType.ATOM) {
    result = evalAtom(env, expr);
  } else if (expr.type === ExprType.STRING_EXPR) {
    result = evalStringExpr(expr);
  } else if (expr.type === ExprType.PRINTED_EXPR) {
    result = evalListExpr(env, expr);
    result.needsPrinted = true;
  } else {
    result = evalListExpr(env, expr);
  }

  if (!env.hasFailed) {
    return result;
  } else {
    const obj = new ErrorObj(env.errorMessage);
    // env.cleanup();
    return obj;
  }
}

function evalStringExpr(expr: Expr): String_Obj | ErrorObj {
  return new String_Obj(expr.value as Atom);
}

// most of running time is spent here.
function evalListExpr(env: Env, expr: Expr): Obj {
  if (expr.value.length === 0) {
    return None_Obj;
  }

  const exprList = expr.value as Expr[];
  const firstExpr = exprList[0]; // get operator with ExprType.LST_EXPR (these expressions in the form of (opt arg1 arg2 ...) )

  if (exprList.length === 1) {
    try {
      return evalAtom(env, firstExpr);
    } catch (error) {
      return handleError(env, "evaluation failed.");
    }
  }

  try {
    let opt: Obj; // opt is of type Procedure, notice opt itself can be of type ExprType.LST_EXPR
    if (firstExpr.type === ExprType.ATOM) {
      opt = evalAtom(env, firstExpr);
    } else {
      opt = evalListExpr(env, firstExpr);
    }

    let result: Obj;
    try {
      const func = builtinOpts[(opt as Procedure).value];
      if ((opt as Procedure).value === "LambdaObj") {
        result = evalExprStartingWithLambdaObj(env, opt, exprList);
        if (result instanceof ErrorObj) {
          return new ErrorObj(result.value);
        } else {
          return result;
        }
      } else if (isExprLiteralOpt(opt as Procedure)) {
        result = func(env, exprList);
        if (result instanceof ErrorObj) {
          return new ErrorObj(result.value);
        } else {
          return result;
        }
      } else {
        const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));
        const result = func(env, ...parameters);
        if (result instanceof ErrorObj) {
          return new ErrorObj(result.value);
        } else {
          return result;
        }
      }
    } catch (error) {
      return handleError(env, "Invalid function call.");
    }
  } catch (e: any) {
    return handleError(env, "evaluation failed.");
  }
}

function evalAtom(env: Env, expr: Expr): Obj {
  try {
    const literal = expr.value as Atom;

    if (isInt(literal)) {
      return new IntNumber(parseInt(literal, 10));
    } else if (isFloat(literal)) {
      return new FloatNumber(parseFloat(literal));
    } else if (isBuiltin(literal)) {
      return getBuiltin(env, literal);
    } else {
      return getFromEnv(env, literal);
    }
  } catch (error) {
    return handleError(env, `Invalid use of ${expr.value as Atom}`);
  }
}

export function getFromEnv(env: Env, literal: string): Obj {
  try {
    const value = env.getFromEnv(literal);
    if (value === undefined) {
      // The reason why we don't throw error here is that sometimes we need plain literal of a symbol, e.g. defining subclass'
      return new Undefined_Obj(literal);
    }
    return value;
  } catch (error) {
    return handleError(env, `${literal} not found in env.`);
  }
}

function isInt(s: Atom): boolean {
  return !isNaN(parseInt(s, 10));
}

function isFloat(s: Atom): boolean {
  return !isNaN(parseFloat(s));
}

function isBuiltin(s: Atom): boolean {
  return s in builtinOpts || s in builtinVars;
}

export function getBuiltin(env: Env, s: string): Procedure {
  try {
    const proc = builtinOpts[s];
    if (proc !== undefined) {
      return new Procedure(s);
    } else {
      const builtinVar = getBuiltinVars(s);
      if (builtinVar instanceof Procedure) {
        return builtinVar;
      } else {
        throw new Error(`Undefined built-in procedure: ${s}`);
      }
    }
  } catch (error) {
    handleError(env, `builtin function ${s} does not exist.`);
    return new Procedure("");
  }
}

function getBuiltinVars(s: Atom): Obj {
  return builtinVars[s];
}
