import { Expr, Atom } from './ast';

export enum ObjType {
    INT,
    FLOAT,
    PROCEDURE,
    BOOL,
    NONE,
    ERROR,
    EXPR,
    LAMBDA_PROCEDURE
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
    name: Atom;

    constructor(value: Function, name: Atom = "lambda", type: ObjType = ObjType.PROCEDURE,) {
        super(value, type);
        this.name = name;
    }
}


export class Lambda_Procedure extends Procedure {
    body: Expr[] | Expr;
    argNames: Expr[]

    constructor(value: Function, name: Atom = "lambda", type: ObjType = ObjType.LAMBDA_PROCEDURE, argNames: Expr[], body: Expr[] | Expr = []) {
        super(value, name, type);
        this.body = body
        this.argNames = argNames
    }
}

export class Bool extends Obj {
    constructor(value: boolean, type: ObjType = ObjType.BOOL) {
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
