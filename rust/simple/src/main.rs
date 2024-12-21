fn main() {
  let input = String::from("(+ 1 2)");
  let mut tokens = Vec::new();

  for token in input.split_whitespace() {
    tokens.push(token);
  }

  for token in tokens {
    println!("{}", token)
  }
}
