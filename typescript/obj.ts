import { Expr, Atom } from "./ast";
import { Env } from "./env";

export enum ObjType {
  LIST_OBJ,
  DICT_OBJ,
}

export class Obj {
  value: any;
  name: string = "Obj"; // Name property representing the class name
  needsPrinted: Boolean = false;
  subObjs: Map<string, Obj> = new Map<string, Obj>();

  constructor(value: any) {
    this.value = value;
  }

  toString(): string {
    return `[${this.name}] ${String(this.value)}`;
  }

  copy(): Obj {
    let obj = new Obj(this.value);
    obj.needsPrinted = this.needsPrinted;

    return obj;
  }
}

export class ErrorObj extends Obj {
  name = "ErrorObj"; // Class name
  constructor(value: string) {
    super(value);
  }
}

export class IntNumber extends Obj {
  name = "IntNumber"; // Class name
  constructor(value: number) {
    super(value);
  }
}

export class FloatNumber extends Obj {
  name = "FloatNumber"; // Class name
  constructor(value: number) {
    super(value);
  }
}

export type Number = IntNumber | FloatNumber;

export class Procedure extends Obj {
  name = "Procedure"; // Class name
}

export class Lambda_Procedure extends Obj {
  name = "Lambda_Procedure"; // Class name
  body: Expr[] | Expr;
  argNames: Expr[];
  info: string;
  env: Env = new Env();
  requirements: [number, string][] = [];
  belongToWhichStruct: undefined | StructInstanceObj = undefined;

  constructor(
    value: string = "LambdaObj",
    info: Atom = "",
    argNames: Expr[],
    body: Expr[] | Expr = [],
    fatherEnv: Env = new Env(),
    requirements: [number, string][] = []
  ) {
    super(value);
    this.info = info;
    this.body = body;
    this.argNames = argNames;
    this.env.fatherEnv = fatherEnv;
    this.requirements = requirements;
  }

  toString(): string {
    return `[${this.name}] ${this.value}, ${this.info}`;
  }

  copy(): Lambda_Procedure {
    let obj = new Lambda_Procedure(
      this.value,
      this.info,
      this.argNames,
      this.body,
      this.env.fatherEnv
    );
    return obj;
  }
}

export class Bool extends Obj {
  name = "Bool"; // Class name
  constructor(value: boolean) {
    super(value);
  }
}

export class List_Obj extends Obj {
  name = "List_Obj"; // Class name
  type: ObjType;

  constructor(value: Array<Obj>, type: ObjType = ObjType.LIST_OBJ) {
    super(value);
    this.type = type;
  }

  copy(): List_Obj {
    return new List_Obj(this.value, this.type);
  }
}

export class Dict_Obj extends Obj {
  name = "Dict_Obj"; // Class name
  type: ObjType;

  constructor(value: { [key: string]: Obj }, type: ObjType = ObjType.DICT_OBJ) {
    super(value);
    this.type = type;
  }

  toString(): string {
    let result = "{";
    for (let key in this.value) {
      result += key + ":" + this.value[key] + ", ";
    }
    result += "}";
    return result;
  }

  copy(): Dict_Obj {
    return new Dict_Obj(this.value, this.type);
  }
}

export const TRUE = new Bool(true);
export const FALSE = new Bool(false);
export const None_Obj = new Obj(null);

export class ExprObj extends Obj {
  name = "ExprObj"; // Class name
  constructor(value: Expr) {
    super(value);
  }

  toString(): string {
    return `[${this.name}] ExprObj: ${String(this.value)}`;
  }
}

export class PRINTED_EXPRObj extends Obj {
  name = "PRINTED_EXPRObj"; // Class name
  constructor(value: Expr) {
    super(value);
  }
}

export class String_Obj extends Obj {
  name = "String_Obj"; // Class name
  constructor(value: string) {
    super(value);
  }
}

export class Class_Obj extends Obj {
  name = "Class_Obj"; // Class name
  constructor(value: string) {
    super(value); // value stores class name.
  }
}

export class Instance_Obj extends Obj {
  name = "Instance_Obj"; // Class name
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

  toString(): string {
    let result = `${this.instanceName}(${this.className}) `;
    for (let key of this.value) {
      result += `{${key}}}`;
    }
    return result;
  }

  copy(): Instance_Obj {
    return new Instance_Obj(this.value, this.instanceName, this.className);
  }
}

export class Undefined_Obj extends Obj {
  name = "Undefined_Obj"; // Class name
  constructor(value: string) {
    super(value);
  }
}

export class AIObj extends Obj {
  name = "AIObj";
  constructor(value: string) {
    super(value);
  }
}

type MultiDimArray = Obj | MultiDimArray[];

export class ArrayObj extends Obj {
  name = "ArrayObj"; // Class name
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

export class ThrowError extends Obj {
  name = "throwError";
  constructor(s: string) {
    super(s);
  }
}

export class StructInstanceObj extends Obj {
  name = "struct";
  privates: string[] = [];
  publics: string[] = [];
  env: Env = new Env();
  init: Lambda_Procedure | undefined;

  constructor(father: StructInstanceObj | undefined = undefined) {
    super("");
  }

  set(s: string, obj: Obj) {
    if (this.privates.includes(s)) {
      this.privates.push(s);
      this.env.set(s, None_Obj);
    } else {
      this.publics.push(s);
      this.env.set(s, None_Obj);
    }
    this.env.set(s, obj);
  }

  copy() {
    const out = new StructInstanceObj();
    out.privates = [...this.privates];
    out.publics = [...this.publics];
    out.env = this.env;
    out.init = this.init;
    return out;
  }
}
