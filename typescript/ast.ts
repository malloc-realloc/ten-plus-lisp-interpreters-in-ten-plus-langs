export enum ExprType {
  ATOM,
  LST_EXPR,
  PRINTED_EXPR,
  STRING_EXPR,
  ERROR,
}

export type Atom = string;

export type AtomOrExprVec = Atom | Array<Atom | Expr>;
export class Expr {
  type: ExprType;
  value: AtomOrExprVec;

  constructor(type: ExprType, value: AtomOrExprVec) {
    this.type = type;
    this.value = value;
  }

  toString(): string {
    const getLiteralStr = (value: any): string => {
      if (Array.isArray(value)) {
        let result = "[";
        for (let i = 0; i < value.length; i++) {
          result += getLiteralStr(value[i]);
          if (i < value.length - 1) {
            result += ",";
          }
        }
        result += "]";
        return result;
      } else {
        return `${value}`;
      }
    };

    return getLiteralStr(this.value);
  }
}
