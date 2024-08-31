export enum ExprType {
  ATOM,
  LST_EXPR,
  LLM_EXPR,
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
    if (Array.isArray(this.value)) {
      const literalStr = this.value
        .map((item) => item.toString())
        .join(",\n  ");
      return `{\n  "Type": "${ExprType[this.type]}",\n  "AtomOrExprVec": [\n  ${literalStr}\n  ]\n}`;
    } else {
      return `{\n  "Type": "${ExprType[this.type]}",\n  "AtomOrExprVec": "${this.value}"\n}`;
    }
  }
}
