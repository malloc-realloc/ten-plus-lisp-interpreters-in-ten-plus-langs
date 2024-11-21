// main.ts
import { tokenize } from "./token";
import { parseExprs } from "./parser";
import { evalExprs } from "./eval";
import { Env } from "./env";
import { Obj } from "./obj";
import { Expr } from "./ast";

const exprs: string[] = [
  // "(define r 1)",
  // "(define func (lambda (x) (define r 2) (+ x r)))",
  // "(func 2)",
  // "(display r)",
  // "(define r 1)",
  // "(define func (lambda (x) (+ x r)))",
  // "(func 2)",
  // '(define a "Hah")',
  // "(define a 2)",
  // "(define fa (lambda (x) (+ x a)))",
  // "(fa 2)",
  // "((lambda (x) (+ x 1)) 2)",
  // "(define f (lambda (x) (+ 2 x)))",
  // "(f 4)",
  // "(define f 20)",
  // "(define higher_levelFunction (lambda (x) (lambda (y)  (display x) (+  y x f))))",
  // "(define add2 (higher_levelFunction 2))",
  // "(add2 4)",
  // "x",
  // "f",
  // "(define r 2)",
  // "(define with_r_2 (lambda (x) (+ r x)))",
  // "(with_r_2 10)",
  // "(define r 10)",
  // "(with_r_2 10)",
  // "(if (> -1 0) 2 1)",
  // "(if 0 2 1)", // 0 is consider as TRUE
  // "(define r 10)",
  // "(set! r 2)",
  // "(define e (quote + 1 2))",
  // "(eval e)",
  // "(define qe (quote 1))",
  // "(eval qe)",
  // "(eval (car `(1)))",
  // "(eval (car `(1 1 1 )))",
  // "(eval (cdr `(1 + 1 1)))",
  // "(eval (car `((+ 1  1)) ))",
  // "(cdr (quote 1 2 3))",
  // "(cons `1 `(1 1))",
  // "(cons (quote +) `(1 1 ))",
  // "(define oneAddOneForm (cons (quote +) `(1 1 )))",
  // "(eval oneAddOneForm)",
  // "(cons `+ `(1 1))",
  // "(quote 1)",
  // "(define 世界 1)",
  // "(display 世界)",
  // "(define temp (cons `a `(1 1)))",
  // "(cons `(a b) `(b c d))", // "(cons `(a b) `(b c d))" is wrong
  // "(cons `(a b) `c)",
  // "(cons `a `3)",
  // "(define shit (quote + 1 1))",
  // "(eval shit)",
  // "",
  // '(define a "sanyan")',
  // '(define m "hello, world")',
  // '"hello, world"',
  // '(+ "hello " "world")',
  // '(display (+ "hello" " world!"))',
  // "(display (+ 1 1))",
  // '(define a "s")',
  // "(define lst (list 1 a (+ 2 3) (lambda (x) (+ x 2))))",
  // "(get lst 1)",
  // "(set lst 1 2)",
  // "(push lst 100)",
  // "lst",
  // '(define d (dict "a" 1 "b" 2 "c" 3 "def" "def" "0" (+ 1 2)))',
  // '(get d "a")',
  // '(set d "a" 100)',
  // "(bind a (+ 1 1) (define b 2))",
  // "(update a 1)",
  // "(+ b 2)",
  // "(bind a (define c 2))",
  // "(update a 2)",
  // "(+ c 1)",
  // // "\"The following expressions is OOP of this language: bind expressions to item of dict. lambda doesn't work because lambda is bound with local env. bind works because it's using global env\"",
  // '"that might be the reason why react can be written by both binding expressions to obj and class"',
  // '(define d (dict "f" 0 "b" 2))',
  // '(set d "f" 0)',
  // '(bind (get d "f") (set d "b"  ( + (get d "b" ) 1) ) )',
  // '(update (get d "f") 0)',
  // '(display (get d "b"))',
  // '(update (get d "f") 0)',
  // '(get d "b")',
  // '(str "; " (+ 1 1) (lambda (x) (+ x 1)))',
  // "(define f (lambda (x) (if x (begin (display x) (f (- x 1)) ) 0)))",
  // "(f 2)",
  // "(if 0 1 2)",
  // "(define d 2)",
  // "(while d (display d) (update d (- d 1)))",
  // "(random 1 2)",
  // "(randInt 1 3)",
  // '(randChoice 1 2 "Hah")',
  // "(return 1)",
  // "(_displayFuncDepth)",
  // "(define f (lambda (x) (_displayFuncDepth) (return x) (display 2) ))",
  // "(f 4)",
  // "(define f (lambda (x) (if x (return x)) (+ x 1)))",
  // "(f 0)",
  // "(f 1)",
  // "(+ 11 2)",
  // "(+ 1 2)",
  // "(if 1 0)",
  // "(define x 3)",
  // "(define f (lambda () (define x 2))) ",
  // "x",
  // "(begin (display 1) (display 2))",
  // "(class A a b)",
  // "(instance A temp)",
  // "(getItem temp a)",
  // "(setItem temp a 2)",
  // "(getItem temp a)",
  // "temp",
  // "",
  // "(getItem temp a)",
  // "(setMethod A m (lambda (x) (+ x (getItem this a)) ))",
  // "(callMethod temp m 2)",
  // "(subclass A subclassOfA c)",
  // "(instance subclassOfA temp2)",
  // "(setItem temp2 c 3)",
  // "(getItem temp2 a)",
  // "(callMethod temp2 m 2)",
  // "(+ 2 a)",
  // "(- 2 a)",
  // "(and 1 0 2)",
  // "(or 1 0)",
  // "(for (define a 3)(> a 0)(define a (- a 1)) (if (< a 2) (return 100)) (display a))",
  // "(for (define a 3)(> a 1)(define a (- a 1)) (display a))",
  // "(** 2 3)",
  // "(define arr (array 2 2 3))",
  // "(setArr (** 2 3) arr 0 0  0)",
  // "(getArr arr 0 0 0)",
  // "arr",
  // "(define a 1)",
  // "(LLM ha a)", // The reason why this works is that ha is undefined and I treat it as plain literal.
  // "(AI 你好 a )",
  // "(= 1 2)",
  // "(= 1 1)",
  // "(define d 10)",
  // "(let (define a 2) (+ 1 a))",
  // "(switch 10 (1 2) ((+ 5 5) 3) (7 10))",
  // "(concat (list 1 2) (list 3 5))",
  // "(define a 1)",
  // "(define b (++ a ))",
  // "b",
  // "a",
  // "(-- a)",
  // "a",
  // "(define a 5)",
  // "(+= a 3)",
  // "a",
  // "(-= a 3)",
  // "(*= a 4)",
  // "(/= a 4)",
  // '(format "hello, $0, $1, 1" "sanyan" "world" 1)',
  // '(macro "hAha" "haha")',
  // '"hAha"',
  // "(define hAha 2)",
  // "haha",
  // "{define a 1}",
  // "a",
  // "{+ 1 a}",
  // "(a)(a)",
  // '(define a "世界")',
  // "(define b 1)",
  // "你好{a}        ,{b}次,不显示括号里的东西(define c 1)",
  // "{c}",
  // "{define a 1}",
  // "(define f (lambda (x) (update a x)))",
  // "{f 2}",
  // "{a}",
  // "{define a {list 1 2 3}}",
  // "{define double {lambda (x) (* 2 x)}}",
  // "{map a double}",
  // '{import "./typescript/math.tslisp"}',
  // "(triple 3)",
  // ":: can be used to do OOP. Such kind of OOP(able retrieve locally bound variable from a function) is unseen in other languages.",
  // "{define fun (lambda (x) (define fun2 (lambda (y) (+ y x))) (define fun3 (lambda (z) (define tt (* x z)) (define fun4 (lambda (t) (/ tt t)))))) }",
  // "(:: (fun 1) fun2)",
  // "((:: (fun 1) fun2) 4)",
  // "((:: ((:: (fun 1) fun3) 4) fun4) 2)",
  // "(:: ((:: (fun 1) fun3) 4) tt)",
  // "(define fa (lambda (x) (update a 2)))",
  // "(define a 1)",
  // "(fa a)", // ordinary parameter works like reference para in C++
  // "a", // 2
  // "(define fb (lambda (*x) (update x 2) (display x)))", // *x means make a copy of x
  // "(define  b 1)",
  // "(fb b)",
  // "b", // 1
  // "(define fc (lambda (x) (update c 2)))",
  // "(define c 1)",
  // "(fc c)",
  // "c",
  // "'abc'", // comment using ''
  // "(type 1)",
  // "(const constVar 2)",
  // "(define constVar 3)",
  // "(update constVar 4)",
  // "(not 2)",
  // "(! 0)",
  // "1",
  // "(define f (lambda (x :IntNumber) (+ x 1)))",
  // "(f 2)",
  // "(f 3.2 4)",
  // "(f 3.2)",
  // "literal takes in a regex and when a variable with its name satisfying the regex, we evaluate the following expressions.",
  // "(define count 0)",
  // '(literal varForLiteralTest (display "ha") (++ count))',
  // "(define varForLiteralTest 2)",
  // "count",
  // `(literal ^hello\\w*world$ (display "he") (++ count))`,
  // "(define helloHelloworld 2)",
  // "(define aa 2)",
  // "count",
  // "(define lst (list 1 a (+ 2 3) (lambda (x) (+ x 2))))",
  // "(pop lst)",
  // "(range 10)",
  // "(% 3 2)",
  // "(% 4 2)",
  // "(define l (list 0 1 2 3))",
  // "(reduce l 0 (lambda (x y) (+ x y)) )",
  // "(filter l (lambda (x) x))",
  // "(includes l 2)",
  // "(index l 2)",
  // "(shift l )",
  // "(unshift l 2)",
  // "'tomorrow implement (noun.method objs)'",
  // "(class A a b)",
  // "(instance A temp)",
  // "(setMethod A m (lambda (x) (+ x 1) ))",
  // "(temp.m 2)",
  // "(setItem temp a 3)",
  // "temp.a",
  // "(define sFunc (lambda (x) ()))",
  // "'need to redefine structure of Class Obj'",
  // "(define l (list 0 1 5))",
  // "(splice l 1 1 2 3 4)",
  // "(l)",
  // "(define ls (slice l 1 4))",
  // "(ls)",
  // "(define v 1)",
  // '(child v "c" 2)',
  // '(get-child v "c")',
  // "'inherit from father object'",
  // "(object-create b v 3)",
  // "(b)",
  // '(get-child b "c")',
  // '(child-method v "m" (lambda (x) (this "c")))',
  // '((get-child v "m") 1)',
  // "(define a 1)",
  // "(this a)",
  // "(define l (list 1 2 3))",
  // "(foreach l , i (lambda (x) (display (+ x i)))) ",
  // "l",
  // "(reduce l (lambda (x y) (+ x y)) 0)",
  // '(try {if (== 1 0) 1 (throw "Error")}  {1})',
  // "(enum TypeOne TypeTwo TypeThree)",
  // "(TypeOne)",
  // '(?= (1) b (display "undefined"))',
  // '(?= (0) a (display "undefined"))',
  // "a",
  // "b",
  // "(define a 1 b 2 c 3)",
  // "a",
  // "b",
  // "c",
  // "(struct C (private b) (public a m)  init (lambda (a1 b2) (update a a1) (update b b2)) m (lambda (x) (+ x b))) ",
  // "(define obj (new C 1 2))",
  // "(. obj a)",
  // "((. obj m) 2)",
  // "(extends C CSon)",
  // "(define a 1)",
  // "(define f (lambda (x) (update a x)))",
  // "(f 2)",
  // "(a)"
  // "(define a 1)",
  // "(toString a)",
  // "(every (list 1 2 0) (lambda (x) (x)))",
  // "(define A 1)",
  // "(define f (lambda (x) (x)))",
  // "(className A)",
  // "(define A (Set 1 2 3))",
  // "(push A 3)",
  // "(foreach A (lambda (x) (display x)))",
  // "(->> 2 (lambda (x) (+ x 1)) (lambda (x) (+ x 2)) )",
  // "(define a 1)",
  // "(move b a)",
  // "(b)",
  // "a",
  // "(define ls (list 1 2 3))",
  // "(for_of ls a (display a))",
  // "(for_of ls a , i (display a) (display i))",
  // "(define v 1)",
  // '(child v "c" 2)',
  // '(get-child v "c")',
  // "(extract_class b_class v)",
  // "(instance b_class b-instance)",
  // "(b-instance.c)",
  // "(define a 1)",
  // "(listen a (2) (display a))",
  // "(update a 0)",
  // "(define a 1)",
  // "(alias a1 a)",
  // "(shallow-copy a2 a)",
  // "(a1)",
  // "(define a 2)",
  // "(a1)",
  // "(a2)",
  // "(define d 1)(ret 1)(display 2)",
  // "(while d (define a 2)(if (d) (ret d)) (display 2) (update d (- d 1)))",
  // "(d)",
  // "(for (define a 3)(> a 0)(define a (- a 1)) (if (< a 2) (ret 100)) (display a))",
  // "(begin (display  2) (display 3))",
  // "(namespace space (c 2) (a 3))",
  // "(space::c)",
  // "(malloc a 3)",
  // "(free a )",
  // "a",
  "(macro-bind ^a$ x 3)",
  "(var a)",
  "(var-bind a b 2)",
  "(var-get a b)",
  "(var-get a x)",
  '(#include (f x y) "(if x y)")',
];

const globalEnv = new Env();

for (const expr of exprs) {
  // const result = evalExtractedExpressions(globalEnv, expr);
  const tokens: string[] = tokenize(globalEnv, expr);
  const ast: Expr[] = parseExprs(tokens);
  const results: Obj = evalExprs(globalEnv, ast);
  console.log(results.toString());
}
