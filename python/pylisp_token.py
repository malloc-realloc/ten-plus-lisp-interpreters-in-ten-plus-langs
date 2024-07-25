from re import sub, UNICODE


def tokenize(expr: str) -> list[str]:
    # Replace `( with (quote
    expr = expr.replace("`(", "(quote ")

    expr = sub(
        r"`([\w+\-*/!@#$%^&=<>?]+|[^\s\(\)]+)", r"(quote \1)", expr, flags=UNICODE
    )

    # Original replacements
    expr = expr.replace("(", "( ").replace(")", " )")
    expr = sub(r"\s+", " ", expr)
    expr = expr.strip()

    return expr.split(" ")
