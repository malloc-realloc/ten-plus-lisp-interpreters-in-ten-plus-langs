export enum ExprType {
  ATOM,
  LST_EXPR,
  LLM_EXPR,
  STRING_EXPR,
  ERROR,
}

export type Atom = string;

export type Literal = Atom | Array<Atom | Expr>;

export class Expr {
  type: ExprType;
  literal: Literal;

  constructor(type: ExprType, literal: Literal) {
    this.type = type;
    this.literal = literal;
  }

  toString(): string {
    if (Array.isArray(this.literal)) {
      const literalStr = this.literal
        .map((item) => item.toString())
        .join(",\n  ");
      return `{\n  "Type": "${ExprType[this.type]}",\n  "Literal": [\n  ${literalStr}\n  ]\n}`;
    } else {
      return `{\n  "Type": "${ExprType[this.type]}",\n  "Literal": "${this.literal}"\n}`;
    }
  }
}
