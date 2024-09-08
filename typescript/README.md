<table border="1" cellpadding="5" cellspacing="0">
  <tr>
    <th style="text-align:left; width:30%;">User Input</th>
    <th style="text-align:left; width:30%;">Interpreter Return</th>
    <th style="text-align:left; width:40%;">Application</th>
  </tr>
  <tr>
    <td><code>(+ 1 1) (- 2 1) (* 2 2) (** 2 4) (/ 4 2) (+ "a" "b")</td>
    <td>[Number] 2 1 4 16 2 "ab"</td>
    <td>Calculate 1 + 1</td>
  </tr>
  <tr>
    <td><code>(define a "Hello world")</td>
    <td>[String_Obj] "Hello world"</td>
    <td>Store information and give it a name</td>
  </tr>
  <tr>
    <td><code>(= 1 2) (= "a" "a")</td>
    <td>[Bool] false, true</td>
    <td>Compare 2 string objects or 2 numbers.</td>
  </tr>
  <tr>
    <td><code>(define fun (lambda (x) (define localVar 2) (+ localVar x)))</td>
    <td>[Lambda_Procedure] LambdaObj</td>
    <td>Define a named function. By default, it returns the result of the last expression.</td>
  </tr>
  <tr>
    <td><code>(fun 2)</td>
    <td>[Number] 4</td>
    <td>call a function</td>
  </tr>
  <tr>
    <td><code>(define higherLevelFunction (lambda (x) (lambda (y) (+ y x 2))))</td>
    <td>[Lambda_Procedure] LambdaObj</td>
    <td>Creates a higher-level function that takes an argument <code>x</code> and returns another function that takes <code>y</code>. The inner function returns the sum of <code>y</code>, <code>x</code>, and <code>2</code>.</td>
  </tr>
  <tr>
    <td><code>(define add2 (higherLevelFunction 2))</td>
    <td>[Lambda_Procedure] LambdaObj</td>
    <td>Defines a new function <code>add2</code> by applying <code>higherLevelFunction</code> to <code>2</code>. This new function adds <code>2</code> to its input.</td>
  </tr>
  <tr>
    <td><code>(add2 4)</td>
    <td>[Number] 8</td>
    <td>Calls the <code>add2</code> function with <code>4</code> as the argument. It will return the result <code>8</code>.</td>
  </tr>
  <tr>
    <td><code>(if (&gt; -1 0) 2 1)</code></td>
    <td>[Number] 1</td>
    <td>This conditional expression checks if <code>-1</code> is greater than <code>0</code>. Since the condition is false, it returns <code>1</code>. If true, it would return <code>2</code>.</td>
  </tr>
  <tr>
    <td><code>(define d 10) (while d (define d (- d 1)))</code></td>
    <td>Updates values until <code>d</code> becomes false</td>
    <td>This loop continuously displays the value of <code>d</code> and decrements it by <code>1</code> until <code>d</code> is false (e.g., <code>0</code>).</td>
  </tr>
  <tr>
    <td><code>(randChoice 1 2 "Hah")</code></td>
    <td>One of the values: <code>1</code>, <code>2</code>, or <code>"Hah"</code></td>
    <td>Calls a function to randomly choose between <code>1</code>, <code>2</code>, and <code>"Hah"</code>. Returns one of these values.</td>
  </tr>
  <tr>
    <td><code>(define f (lambda (x) (if x (return x)) (+ x 1)))</code></td>
    <td>Function definition</td>
    <td>Defines a function <code>f</code> that returns <code>x</code> if it is true. Otherwise, it increments <code>x</code> by <code>1</code> and returns the result.</td>
  </tr>
  <tr>
  <td><code>(LLM ha a)</code></td>
  <td>[PRINTED_EXPRObj] Large language model output</td>
  <td>Call large language model to evaluate given parameters. If a parameter is not defined, it is treated as literal string. If a parameter is defined, it's treated as value of that parameter. For example, when <code>(= a 1)</code>, and <code>ha</code> is not defined, the parameters are <code>["ha", 1]</code></td>
  <td>.</td>
</tr>
<tr>
  <td><code>(AI 你好 a)</code></td>
  <td>[PRINTED_EXPRObj] </td>
  <td>AI and LLM are 2 equivalent functions.</td>
  <td></td>
</tr>
</table>
