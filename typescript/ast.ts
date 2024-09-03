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
    const getLiteralStr = (value: any): string => {
      if (Array.isArray(value)) {
        let result = "[";
        for (let i = 0; i < value.length; i++) {
          // 递归处理数组中的每个元素
          result += getLiteralStr(value[i]);
          if (i < value.length - 1) {
            result += ","; // 添加逗号分隔符
          }
        }
        result += "]";
        return result;
      } else {
        // 处理基本类型
        return `${value}`;
      }
    };

    return getLiteralStr(this.value);
  }
}
