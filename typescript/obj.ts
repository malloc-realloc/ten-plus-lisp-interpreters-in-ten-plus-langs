import exp from "constants";
import { Expr, Atom } from "./ast";
import { Env } from "./env";
import { on } from "events";

export enum ObjType {
  INT,
  FLOAT,
  PROCEDURE,
  BOOL,
  NONE,
  ERROR,
  EXPR,
  LAMBDA_PROCEDURE,
  LLM_EXPR_OBJ,
  STRING_OBJ,
  LIST_OBJ,
  DICT_OBJ,
  ERROR_OBJ,
}

export class Obj {
  value: any;
  type: ObjType;

  constructor(value: any, type: ObjType) {
    this.value = value;
    this.type = type;
  }

  toString(): string {
    return `Obj is ${String(this.value)}, type is ${ObjType[this.type]}`;
  }
}

export class ErrorObj extends Obj {
  constructor(value: string, type: ObjType = ObjType.ERROR_OBJ) {
    super(value, type);
  }
}

export class IntNumber extends Obj {
  constructor(value: number, type: ObjType = ObjType.INT) {
    super(value, type);
  }
}

export class FloatNumber extends Obj {
  constructor(value: number, type: ObjType = ObjType.FLOAT) {
    super(value, type);
  }
}

export type Number = IntNumber | FloatNumber;

export class Procedure extends Obj {
  // To make sure everything passed inside evalListExpr is Object, we introduce Procedure to store lambda_function and builtin operators like +-*/
  name: Atom;

  constructor(
    value: any,
    name: Atom = "lambda",
    type: ObjType = ObjType.PROCEDURE
  ) {
    super(value, type);
    this.name = name;
  }
}

export class Lambda_Procedure extends Procedure {
  body: Expr[] | Expr;
  argNames: Expr[];
  env: Env;
  require_new_env_when_eval: Boolean;

  constructor(
    value: any,
    name: Atom = "lambda",
    type: ObjType = ObjType.LAMBDA_PROCEDURE,
    argNames: Expr[],
    body: Expr[] | Expr = [],
    env: Env,
    require_new_env_when_eval: Boolean = true
  ) {
    super(value, name, type);
    this.body = body;
    this.argNames = argNames;
    this.env = env;
    this.require_new_env_when_eval = require_new_env_when_eval;
  }
}

export class Bool extends Obj {
  constructor(value: boolean, type: ObjType = ObjType.BOOL) {
    super(value, type);
  }
}

export class List_Obj extends Obj {
  constructor(value: Array<Obj>, type: ObjType = ObjType.LIST_OBJ) {
    super(value, type);
  }
}

export class Dict_Obj extends Obj {
  constructor(value: { [key: string]: Obj }, type: ObjType = ObjType.DICT_OBJ) {
    super(value, type);
  }
}

export class Error extends Obj {
  constructor(value: string = "", type: ObjType = ObjType.ERROR) {
    super(value, type);
  }
}

export const TRUE = new Bool(true, ObjType.BOOL);
export const FALSE = new Bool(false, ObjType.BOOL);
export const None_Obj = new Obj(null, ObjType.NONE);

export class ExprObj extends Obj {
  constructor(value: Expr, type: ObjType = ObjType.EXPR) {
    super(value, type);
  }
}

export class LLM_EXPRObj extends Obj {
  constructor(value: Expr, type: ObjType = ObjType.LLM_EXPR_OBJ) {
    super(value, type);
  }
}

export class String_Obj extends Obj {
  constructor(value: string, type: ObjType = ObjType.STRING_OBJ) {
    super(value, type);
  }
}
