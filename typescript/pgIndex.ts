import { evalExpression } from ".";
import { Env } from "./env";
import { evalExpr, evalExprs, evalStrExprs } from "./eval";
import { parseExprs } from "./parser";
import { tokenize } from "./token";

let text = "";

function userInit(
  env: Env,
  expr: string,
  monitor: Map<string, [string[], string]>
) {
  evalStrExprs(env, expr);

  for (let [key, value] of monitor) {
    env.set(key, evalStrExprs(env, value[1]));
  }
}

function userChangeMonitorAndRerun(
  env: Env,
  varName: string,
  value: [string[], string],
  monitor: Map<string, [string[], string]>
) {
  env.set(varName, evalStrExprs(env, value[1]));
  for (let [key, value] of monitor) {
    if (key !== varName) {
      if (value[0].includes(varName)) {
        env.set(key, evalStrExprs(env, value[1]));
      }
    }
  }
}

function displayedText(env: Env): string {
  return evalExpression(env, text);
}

function pgIndex() {
  const env = new Env();

  text = "A: Today a Tesla stock price is {a}. {func1}\n{func2}";

  let monitor: Map<string, [string[], string]> = new Map<
    string,
    [string[], string]
  >();

  monitor.set("a", [[], "20000"]);
  monitor.set("func1", [
    ["a"],
    '(define taxedPrice (* a taxRate))(if (< taxedPrice 40000) (+ "taxedPriced " taxedPrice " So cheap, we should buy it.") (+ "taxedPriced " taxedPrice " So expensive, you should not buy it"))',
  ]);
  monitor.set("func2", [
    ["func1", "a"],
    '(+ "B: Your judgement \'" func1 "\' is terrible. Reconsider the price " a " again.")',
  ]);

  userInit(env, "(define taxRate 2)", monitor);

  console.log(displayedText(env));

  userChangeMonitorAndRerun(env, "a", [[], "10000"], monitor);

  console.log(displayedText(env));
}

pgIndex();
