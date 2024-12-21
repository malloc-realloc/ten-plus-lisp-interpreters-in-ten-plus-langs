fn tokenize(input: &str) -> Vec<&str> {
    let mut tokens = Vec::new();
    let mut start = 0;

    while start < input.len() {
        let ch = input[start..].chars().next().unwrap(); // Get the first character from the slice

        if ch.is_whitespace() {
            start += ch.len_utf8(); // Skip whitespace
        } else if ch == '(' || ch == ')' {
            // Handle single-character tokens
            tokens.push(&input[start..start + ch.len_utf8()]);
            start += ch.len_utf8();
        } else {
            // Handle general tokens
            let mut end = start;
            while end < input.len() {
                let ch = input[end..].chars().next().unwrap();
                if ch.is_whitespace() || ch == '(' || ch == ')' {
                    break;
                }
                end += ch.len_utf8();
            }
            tokens.push(&input[start..end]);
            start = end;
        }
    }

    tokens
}

fn main() {
    let input = "Hello (world) (this is a test)";
    let tokens = tokenize(input);
    for token in tokens {
        println!("{}", token);
    }
}
