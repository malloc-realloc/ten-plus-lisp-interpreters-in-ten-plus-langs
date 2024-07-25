from typing import NewType, List, Union
from enum import Enum, auto


class ExprType(Enum):
    ATOM = auto()
    LST_EXPR = auto()


Atom = NewType(
    "Atom", str
)  # operator(*+-/), variables, numbers(1,1.2) are of type Atom


class Expr:
    """
    Expr : <ATOM> | <LST_EXPR>
    LST_EXPR: a python list of <Expr>
    """

    def __init__(
        self, type: ExprType, literal: Union[Atom, List[Union[Atom, "Expr"]]]
    ) -> None:
        self.type = type
        self.literal = literal

    def __str__(self) -> str:
        if isinstance(self.literal, list):
            literal_str = "[" + ", ".join(str(item) for item in self.literal) + "]"
        else:
            literal_str = str(self.literal)
        return f"Type: {self.type}, Literal: {literal_str}"
