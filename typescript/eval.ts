// eval.ts
import { Expr, ExprType, Atom } from "./ast";
import {
  Obj,
  IntNumber,
  FloatNumber,
  Procedure,
  None_Obj,
  ObjType,
  LLM_EXPRObj,
  String_Obj,
  ErrorObj,
} from "./obj";
import { Env } from "./env";
import {
  builtin_operators,
  builtinVars,
  is_special_operator,
} from "./builtins";

export function evalExpr(env: Env, expr: Expr): Obj {
  let result: Obj;
  if (expr.type === ExprType.ATOM) {
    result = evalAtom(env, expr);
  } else if (expr.type === ExprType.LLM_EXPR) {
    result = evalLLMExpr(env, expr);
  } else if (expr.type === ExprType.STRING_EXPR) {
    result = evalStringExpr(env, expr);
  } else {
    result = evalListExpr(env, expr);
  }

  if (!env.hasFailed) {
    return result;
  } else {
    const obj = new ErrorObj(env.errorMessage);
    env.errorMessage = "";
    env.hasFailed = false;
    return obj;
  }
}

function evalStringExpr(env: Env, expr: Expr): String_Obj | ErrorObj {
  return new String_Obj(expr.literal as Atom);
}

function evalLLMExpr(env: Env, expr: Expr): Obj {
  let new_literal: string = "";
  for (let i = 0; i < expr.literal.length; i++) {
    if (expr.literal[i] !== "[") {
      new_literal += expr.literal[i];
    } else {
      let varName = "";
      i++; // skip [
      for (let j = i; j < expr.literal.length && expr.literal[j] !== "]"; j++) {
        varName += expr.literal[j];
        i++;
      }

      let v: Obj | undefined = env.get(varName);
      if (v === undefined) {
        continue;
      } else {
        new_literal += String(v.value);
      }
    }
  }

  return new LLM_EXPRObj(new Expr(ExprType.LLM_EXPR, new_literal));
}

// most of running time is spent here.
function evalListExpr(env: Env, expr: Expr): Obj {
  const exprList = expr.literal as Expr[];

  const firstExpr = exprList[0]; // get operator with ExprType.LST_EXPR (these expressions in the form of (opt arg1 arg2 ...) )

  try {
    let opt: Procedure; // opt is of type Procedure, notice opt itself can be of type ExprType.LST_EXPR
    if (firstExpr.type === ExprType.ATOM) {
      opt = evalAtom(env, firstExpr) as Procedure;
    } else {
      opt = evalListExpr(env, firstExpr) as Procedure;
    }

    if (is_special_operator(opt)) {
      const func = builtin_operators[opt.name];
      let result: Obj;
      if (opt.name === "evalLambdaObj") {
         result = func(env, opt, exprList);
      } else  {
        result = func(env, exprList);
      }
      if (result instanceof ErrorObj) {
        return new ErrorObj(result.value);
      } else {
        return result;
      }
    } else {
      // All operations that don't work on expression literal directly starts from there.
      const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));
      const result = opt.value(env, ...parameters);
      if (result instanceof ErrorObj) {
        return new ErrorObj(result.value);
      } else {
        return result;
      }
    }
  } catch (e: any) {
    console.error(`An error occurred: ${e.message}`);
    throw e;
  }
}

function evalAtom(env: Env, expr: Expr): Obj {
  const literal = expr.literal as Atom;

  if (isInt(literal)) {
    return new IntNumber(parseInt(literal, 10));
  } else if (isFloat(literal)) {
    return new FloatNumber(parseFloat(literal));
  } else if (isBuiltin(literal)) {
    return getBuiltin(literal);
  } else {
    return getFromEnv(env, literal);
  }
}

export function getFromEnv(env: Env, literal: string): Obj {
  const value = env.get(literal);
  if (value === undefined) {
    // console.error(
    //   `Error: retrieve undefined variable ${literal} from environment`
    // );
    return new Obj(literal);
  }
  return value;
}

function isInt(s: Atom): boolean {
  return !isNaN(parseInt(s, 10));
}

function isFloat(s: Atom): boolean {
  return !isNaN(parseFloat(s));
}

function isBuiltin(s: Atom): boolean {
  return s in builtin_operators || s in builtinVars;
}

export function getBuiltin(s: string): Procedure {
  const proc = builtin_operators[s];
  if (proc !== undefined) {
    return new Procedure(proc, s);
  } else {
    const builtinVar = getBuiltinVars(s);
    if (builtinVar instanceof Procedure) {
      return builtinVar;
    } else {
      throw new Error(`Undefined built-in procedure: ${s}`);
    }
  }
}

function getBuiltinVars(s: Atom): Obj {
  return builtinVars[s];
}
