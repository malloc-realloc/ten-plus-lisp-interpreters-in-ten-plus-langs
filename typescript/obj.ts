import { Expr, Atom } from "./ast";
import { call_method } from "./builtins";
import { Env } from "./env";

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
  CLASS_OBJ,
  INSTANCE_OBJ,
  UNDEFINED_OBJ,
  Array_Obj,
}

export class Obj {
  value: any;

  constructor(value: any) {
    this.value = value;
  }

  toString(): string {
    return `Obj is ${String(this.value)}, type is ${typeof this.value}`;
  }
}

export class ErrorObj extends Obj {
  constructor(value: string, ) {
    super(value);
  }
}

export class IntNumber extends Obj {
  constructor(value: number,) {
    super(value);
  }
}

export class FloatNumber extends Obj {
  constructor(value: number, ) {
    super(value);
  }
}

export type Number = IntNumber | FloatNumber;

export class Procedure extends Obj {
  name: Atom;
  // To make sure everything passed inside evalListExpr is Object, we introduce Procedure to store lambdaFunction and builtin operators like +-*/

  constructor(
    value: Function | string, // value of Procedure stores ts function (when user uses builtin functions), and stores string when user calls user-defined lambda function (as toString of this lambda function).
    name: Atom = "lambda",

  ) {
    super(value);
    this.name = name;
  }
}

export class Lambda_Procedure extends Procedure {
  body: Expr[] | Expr;
  argNames: Expr[];

  constructor(
    value: string,
    name: Atom = "lambda",
    argNames: Expr[],
    body: Expr[] | Expr = [],
  ) {
    super(value, name);
    this.body = body;
    this.argNames = argNames;
  }
}

export class Bool extends Obj {

  constructor(value: boolean, ) {
    super(value);

  }
}

export class List_Obj extends Obj {
  type: ObjType
  constructor(value: Array<Obj>, type: ObjType = ObjType.LIST_OBJ) {
    super(value);
    this.type = type
  }
}

export class Dict_Obj extends Obj {
  type : ObjType
  constructor(value: { [key: string]: Obj }, type: ObjType = ObjType.DICT_OBJ) {
    super(value);
    this.type = type
  }
}

export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const None_Obj = new Obj(null);

export class ExprObj extends Obj {
  constructor(value: Expr, ) {
    super(value);
  }
}

export class LLM_EXPRObj extends Obj {
  constructor(value: Expr, ) {
    super(value);
  }
}

export class String_Obj extends Obj {
  constructor(value: string,) {
    super(value);
  }
}

export class Class_Obj extends Obj {
  constructor(value: string, ) {
    super(value); // value stores class name.
  }
}

export class Instance_Obj extends Obj {
  instanceName: string;
  className: string;

  constructor(
    value: Map<string, Obj>,
    instanceName: string,
    className: string,

  ) {
    super(value);
    this.instanceName = instanceName;
    this.className = className;
  }
}

export class Undefined_Obj extends Obj {
  constructor(value: string) {
    super(value);
  }
}

type MultiDimArray = Obj | MultiDimArray[];

export class ArrayObj extends Obj {
  constructor(array: MultiDimArray) {
    super(array);
  }
}

export function createMultiDimArray(
  dimensions: number[],
  initialValue: Obj = None_Obj
): MultiDimArray {
  if (dimensions.length === 0) {
    return initialValue;
  }

  const [currentDim, ...restDims] = dimensions;
  return Array.from({ length: currentDim.valueOf() }, () =>
    createMultiDimArray(restDims, initialValue)
  );
}
