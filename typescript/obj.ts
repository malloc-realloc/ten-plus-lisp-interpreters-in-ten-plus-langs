import { Expr, Atom } from "./ast";
import { Env } from "./env";

export enum ObjType {
  LIST_OBJ,
  DICT_OBJ,
}

export class Obj {
  value: any;

  constructor(value: any) {
    this.value = value;
  }

  toString(): string {
    return `${String(this.value)}`;
  }
}

export class ErrorObj extends Obj {
  constructor(value: string) {
    super(value);
  }
}

export class IntNumber extends Obj {
  constructor(value: number) {
    super(value);
  }
}

export class FloatNumber extends Obj {
  constructor(value: number) {
    super(value);
  }
}

export type Number = IntNumber | FloatNumber;

export class Procedure extends Obj {}

export class Lambda_Procedure extends Obj {
  body: Expr[] | Expr;
  argNames: Expr[];
  info: string;
  env: Env = new Env();

  constructor(
    value: string = "LambdaObj",
    info: Atom = "",
    argNames: Expr[],
    body: Expr[] | Expr = [],
    fatherEnv: Env = new Env()
  ) {
    super(value);
    this.info = info;
    this.body = body;
    this.argNames = argNames;
    this.env.fatherEnv = fatherEnv;
  }

  toString(): string {
    return `${this.value}, ${this.info}`;
  }
}

export class Bool extends Obj {
  constructor(value: boolean) {
    super(value);
  }
}

export class List_Obj extends Obj {
  type: ObjType;
  constructor(value: Array<Obj>, type: ObjType = ObjType.LIST_OBJ) {
    super(value);
    this.type = type;
  }
}

export class Dict_Obj extends Obj {
  type: ObjType;
  constructor(value: { [key: string]: Obj }, type: ObjType = ObjType.DICT_OBJ) {
    super(value);
    this.type = type;
  }
}

export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const None_Obj = new Obj(null);

export class ExprObj extends Obj {
  constructor(value: Expr) {
    super(value);
  }
}

export class LLM_EXPRObj extends Obj {
  constructor(value: Expr) {
    super(value);
  }
}

export class String_Obj extends Obj {
  constructor(value: string) {
    super(value);
  }
}

export class Class_Obj extends Obj {
  constructor(value: string) {
    super(value); // value stores class name.
  }
}

export class Instance_Obj extends Obj {
  instanceName: string;
  className: string;

  constructor(
    value: Map<string, Obj>,
    instanceName: string,
    className: string
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
