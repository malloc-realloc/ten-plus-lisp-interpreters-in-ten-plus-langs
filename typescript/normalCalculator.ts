type Operator = "+" | "-" | "*" | "/";
type ExprArray = number | [Operator, ExprArray | number, ExprArray | number];

export class ExpressionCalculator {
  private position: number = 0;
  private input: string = "";

  constructor(input: string) {
    this.input = input.replace(/\s/g, "");
  }

  private getPrecedence(op: Operator): number {
    const precedence: Record<Operator, number> = {
      "+": 0,
      "-": 0,
      "*": 1,
      "/": 1,
    };
    return precedence[op];
  }

  private parseNumber(): number {
    let numStr = "";
    while (
      this.position < this.input.length &&
      (this.input[this.position].match(/\d/) ||
        this.input[this.position] === ".")
    ) {
      numStr += this.input[this.position];
      this.position++;
    }
    return parseFloat(numStr);
  }

  private isOperator(char: string): char is Operator {
    return ["+", "-", "*", "/"].includes(char);
  }

  private parseNextExpr(): {
    expr: number | ExprArray;
    nextOp: Operator | null;
  } {
    if (this.position >= this.input.length) {
      throw new Error("End of input");
    }

    const num = this.parseNumber();

    let nextOp: Operator | null = null;
    if (
      this.position < this.input.length &&
      this.isOperator(this.input[this.position])
    ) {
      nextOp = this.input[this.position] as Operator;
      this.position++;
    }

    return { expr: num, nextOp };
  }

  private canContinue(prevOp: Operator, currentOp: Operator): boolean {
    return this.getPrecedence(prevOp) < this.getPrecedence(currentOp);
  }

  public convert(): ExprArray | number {
    const first = this.parseNextExpr();
    if (!first.nextOp) return first.expr;

    return this.parseExpr(first.expr, first.nextOp);
  }

  private parseExpr(leftExpr: ExprArray | number, op: Operator): ExprArray {
    const right = this.parseNextExpr();

    if (!right.nextOp) {
      return [op, leftExpr, right.expr];
    }

    if (this.canContinue(op, right.nextOp)) {
      // 如果下一个运算符优先级更高，先计算右边
      const rightExpr = this.parseExpr(right.expr, right.nextOp);
      return [op, leftExpr, rightExpr];
    } else {
      // 如果下一个运算符优先级更低或相等，先计算左边
      return this.parseExpr([op, leftExpr, right.expr], right.nextOp);
    }
  }

  public evaluate(expr: ExprArray | number): number {
    if (typeof expr === "number") {
      return expr;
    }

    const [operator, left, right] = expr;
    const leftValue = this.evaluate(left);
    const rightValue = this.evaluate(right);

    switch (operator) {
      case "+":
        return leftValue + rightValue;
      case "-":
        return leftValue - rightValue;
      case "*":
        return leftValue * rightValue;
      case "/":
        if (rightValue === 0) throw new Error("Division by zero");
        return leftValue / rightValue;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
}

// function test() {
//   const examples = [
//     "2 + 3 * 4",
//     "2 * 3 + 4",
//     "1 + 2 + 3",
//     "1 * 2 * 3",
//     "1 + 2 * 3 + 4",
//   ];

//   examples.forEach((example) => {
//     const calculator = new ExpressionCalculator(example);
//     const expr = calculator.convert();
//     const result = calculator.evaluate(expr);
//     console.log(`Expression: ${example}`);
//     console.log(`Array format:`, expr);
//     console.log(`Result: ${result}`);
//     console.log("---");
//   });
// }

// test();
