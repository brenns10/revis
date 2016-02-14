/*
  Terminal Symbol Types.
 */
const CharSym = Symbol('CharSym')
const Special = Symbol('Special')
const Eof = Symbol('Eof')
const LParen = Symbol('LParen')
const RParen = Symbol('RParen')
const LBracket = Symbol('LBracket')
const RBracket = Symbol('RBracket')
const Plus = Symbol('Plus')
const Minus = Symbol('Minus')
const Star = Symbol('Star')
const Question = Symbol('Question')
const Caret = Symbol('Caret')
const Pipe = Symbol('Pipe')
const Dot = Symbol('Dot')

/*
  Non-Terminal Symbol Types
*/
const TERM = Symbol('TERM')
const EXPR = Symbol('EXPR')
const REGEX = Symbol('REGEX')
const CLASS = Symbol('CLASS')
const SUB = Symbol('SUB')

/*
  Terminal vs NonTerminal
*/
const NonTerminal = Symbol('NonTerminal')
const Terminal = Symbol('Terminal')

/*
  Instruction Opcodes
*/
const Char = Symbol('char')
const Match = Symbol('match')
const Jump = Symbol('jump')
const Split = Symbol('split')
const Save = Symbol('save')
const Any = Symbol('any')
const Range = Symbol('range')
const NRange = Symbol('nrange')

class Token {
    constructor(symbol, character) {
        this.symbol = symbol
        this.character = character
    }

    toString() {
        return this.symbol.toString() + ": '" + this.character.toString() + "'"
    }
}

class Lexer {
    constructor(input) {
        this.input = input
        this.index = 0
        this.prev = null
        this.token = null
        this.buffer = []
    }

    escape() {
        switch (this.input[this.index]) {
        case '(':
            this.token = new Token(CharSym, '(')
            break
        case ')':
            this.token = new Token(CharSym, ')')
            break
        case '[':
            this.token = new Token(CharSym, '[')
            break
        case ']':
            this.token = new Token(CharSym, ']')
            break
        case '+':
            this.token = new Token(CharSym, '+')
            break
        case '-':
            this.token = new Token(CharSym, '-')
            break
        case '*':
            this.token = new Token(CharSym, '*')
            break
        case '?':
            this.token = new Token(CharSym, '?')
            break
        case '^':
            this.token = new Token(CharSym, '^')
            break
        case 'n':
            this.token = new Token(CharSym, '\n')
            break
        case '.':
            this.token = new Token(CharSym, '.')
            break
        case '|':
            this.token = new Token(CharSym, '|')
            break
        default:
            this.token = new Token(Special, this.input[this.index])
            break
        }
    }

    nextsym() {
        this.prev = this.token

        // Eof forever.
        if (this.index >= this.input.length) {
            this.token = new Token(Eof, 0)
            return this.token
        }

        // Handle buffered symbols.
        if (this.buffer.length > 0) {
            this.token = this.buffer.pop()
            return this.token
        }

        // Otherwise, get the next input.
        switch (this.input[this.index]) {
        case '(':
            this.token = new Token(LParen, '(')
            break
        case ')':
            this.token = new Token(RParen, ')')
            break
        case '[':
            this.token = new Token(LBracket, '[')
            break
        case ']':
            this.token = new Token(RBracket, ']')
            break
        case '+':
            this.token = new Token(Plus, '+')
            break
        case '-':
            this.token = new Token(Minus, '-')
            break
        case '*':
            this.token = new Token(Star, '*')
            break
        case '?':
            this.token = new Token(Question, '?')
            break
        case '^':
            this.token = new Token(Caret, '^')
            break
        case '|':
            this.token = new Token(Pipe, '|')
            break
        case '.':
            this.token = new Token(Dot, '.')
            break
        case '\\':
            this.index++
            this.escape()
            break
        case '\0':
            this.token = new Token(Eof, '\0')
            break
        default:
            this.token = new Token(CharSym, this.input[this.index])
            break
        }
        this.index++
        return this.token
    }

    unget(token) {
        this.buffer.push(this.token)
        this.token = token
    }
}

class ParseTree {
    constructor(type, object) {
        this.type = type
        this.terminal = undefined
        this.nonterminal = undefined
        if (type === Terminal) {
            this.terminal = object
        } else if (type === NonTerminal) {
            this.nonterminal = object
        } else {
            throw Error("Unknown type of ParseTree node.")
        }
        this.children = []
    }

    get numChildren() {
        return this.children.length
    }

    addChild(child) {
        this.children.push(child)
    }

    toStringInternal(indent) {
        var str = ' '.repeat(indent)
        if (this.type === Terminal) {
            str += this.terminal + ';'
        } else {
            str += this.nonterminal.toString() + '{\n'
            for (var child of this.children) {
                str += child.toStringInternal(indent + 1) + '\n'
            }
            str += ' '.repeat(indent) +  '}'
        }
        return str
    }

    toString() {
        return this.toStringInternal(0)
    }
}

class Parser {
    constructor(input) {
        this.input = input
        this.lexer = new Lexer(input)
    }

    accept(symbol) {
        if (this.lexer.token.symbol === symbol) {
            this.lexer.nextsym()
            return true
        }
        return false
    }

    expect(symbol) {
        if (this.lexer.token.symbol === symbol) {
            this.lexer.nextsym()
        } else {
            throw Error("error: expected " + symbol + ", got " + this.lexer.token.symbol)
        }
    }

    class() {
        var result = new ParseTree(NonTerminal, CLASS), curr, prev
        var t1, t2, t3 // tokens from lexer
        curr = result

        while (true) {
            if (this.accept(CharSym)) {
                prev = curr
                t1 = this.lexer.prev
                if (this.accept(Minus)) {
                    t2 = this.lexer.prev
                    if (this.accept(CharSym)) {
                        // character range
                        t3 = this.lexer.prev
                        curr.addChild(new ParseTree(Terminal, t1))
                        curr.addChild(new ParseTree(Terminal, t3))
                        curr.addChild(new ParseTree(NonTerminal, CLASS))
                        curr = curr.children[2]
                    } else {
                        // false alarm - just a character followed by a -
                        this.lexer.unget(t2)
                        curr.addChild(new ParseTree(Terminal, t1))
                        curr.addChild(new ParseTree(NonTerminal, CLASS))
                        curr = curr.children[1]
                    }
                } else {
                    // just a character
                    curr.addChild(new ParseTree(Terminal, t1))
                    curr.addChild(new ParseTree(NonTerminal, CLASS))
                    curr = curr.children[1]
                }
            } else if (this.accept(Minus)) {
                // just a minus
                prev = curr
                curr.addChild(new ParseTree(Terminal, this.lexer.prev))
                curr.addChild(new ParseTree(NonTerminal, CLASS))
                curr = curr.children[0]
            } else {
                // we done
                prev.children.pop()
                break
            }
        }
        return result
    }

    term() {
        var result;
        if (this.accept(CharSym) || this.accept(Dot) || this.accept(Special)) {
            result = new ParseTree(NonTerminal, TERM)
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
        } else if (this.accept(LParen)) {
            result = new ParseTree(NonTerminal, TERM)
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
            result.addChild(this.regex())
            this.expect(RParen)
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
        } else if (this.accept(LBracket)) {
            result = new ParseTree(NonTerminal, TERM)
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
            if (this.accept(Caret)) {
                result.addChild(new ParseTree(Terminal, this.lexer.prev))
            }
            result.addChild(this.class());
            this.expect(RBracket)
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
        } else {
            throw Error("TERM: syntax error\n")
        }
        return result
    }

    expr() {
        var result = new ParseTree(NonTerminal, EXPR)
        result.addChild(this.term())
        if (this.accept(Plus) || this.accept(Star) || this.accept(Question)) {
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
            if (this.accept(Question)) {
                result.addChild(new ParseTree(Terminal, this.lexer.prev))
            }
        }
        return result
    }

    sub() {
        var curr = new ParseTree(NonTerminal, SUB)
        var result = curr
        var prev = curr

        while (this.lexer.token.symbol !== Eof &&
               this.lexer.token.symbol !== RParen &&
               this.lexer.token.symbol !== Pipe) {
            curr.addChild(this.expr())
            curr.addChild(new ParseTree(NonTerminal, SUB))
            prev = curr
            curr = curr.children[1]
        }

        if (prev !== curr) {
            prev.children.pop()
        }
        return result;
    }

    regex() {
        var result = new ParseTree(NonTerminal, REGEX)
        result.addChild(this.sub())
        if (this.accept(Pipe)) {
            result.addChild(new ParseTree(Terminal, this.lexer.prev))
            result.addChild(this.regex())
        }
        return result
    }

    parse() {
        this.lexer.nextsym()
        var result = this.regex()
        this.expect(Eof)
        return result
    }
}

class Instruction {
    constructor(type) {
        this.type = type
    }
}

class CodeGen {
    constructor() {
        this.id = 0
        this.capture = 0
    }

    join(il1, il2) {
        var next = il2[0]
        /*
          il1: array of instructions, ending with "Match"
          il2: array of instructions, also ending with "Match"
         */
        for (var instr of il1) {
            if (instr.type === Jump || instr.type === Split) {
                if (instr.x.type === Match) {
                    instr.x = next
                }
            }
            if (instr.type === Split && instr.y.type === Match) {
                instr.y = next
            }
        }

        // rid ourselves of the devilish Match in il1
        il1.pop()

        return il1.concat(il2)
    }

    term(tree) {
        console.log(tree);
        if (tree.numChildren == 1) {
            // Either character, dot, or special.
            var code = []
            if (tree.children[0].terminal.symbol === CharSym) {
                var i1 = new Instruction(Char)
                i1.c = tree.children[0].terminal.character
                code.push(i1)
            } else if (tree.children[0].terminal.symbol === Dot) {
                var i1 = new Instruction(Any)
                code.push(i1)
            } else {
                throw Error("not implemented - special")
            }
            code.push(new Instruction(Match))
            return code
        } else if (tree.numChildren == 3 &&
                   tree.children[0].terminal.symbol == LParen) {
            // A parenthesized expression.
            var save1 = new Instruction(Save)
            save1.s = this.capture++
            var code1 = [save1].concat(this.regex(tree.children[1]))
            var save2 = new Instruction(Save)
            save2.s = this.capture++
            var match = new Instruction(Match)
            var code2 = [save2, match]
            return this.join(code1, code2)
        } else {
            // Character class
            if (tree.numChildren == 3) {
                return this.class(tree.children[1], false);
            } else {
                return this.class(tree.children[2], true);
            }
        }
    }

    expr(tree) {
        var code = this.term(tree.children[0])
        if (tree.numChildren == 1) {
            return code;
        } else {
            if (tree.children[1].terminal.symbol === Star) {
                var a = new Instruction(Split)
                var b = new Instruction(Jump)
                var c = new Instruction(Match)
                if (tree.numChildren == 3) {
                    // Non-greedy
                    a.x = c
                    a.y = code[0]
                } else {
                    // greedy
                    a.x = code[0]
                    a.y = c
                }
                b.x = a
                code = [a].concat(code)
                var code2 = [b, c]
                return this.join(code, code2)
            } else if (tree.children[1].terminal.symbol === Plus) {
                var a = new Instruction(Split)
                var b = new Instruction(Match)
                if (tree.numChildren == 3) {
                    // non-greedy
                    a.x = b
                    a.y = code[0]
                } else {
                    a.x = code[0]
                    a.y = b
                }
                return this.join(code, [a, b])
            } else {
                // must be question.  I don't like dealing with the last else.
                var a = new Instruction(Split)
                var b = new Instruction(Match)
                if (tree.numChildren == 3) {
                    a.x = b
                    a.y = code[0]
                } else {
                    a.x = code[0]
                    a.y = b
                }
                return this.join([a].concat(code), [b])
            }
        }
    }

    sub(tree) {
        var e = this.expr(tree.children[0])
        if (tree.numChildren == 2) {
            var s = this.sub(tree.children[1])
            return this.join(e, s)
        } else {
            return e
        }
    }

    regex(tree) {
        var s = this.sub(tree.children[0])
        if (tree.numChildren == 3) {
            var r = this.regex(tree.children[2])

            var pre_s = new Instruction(Split)
            pre_s.x = s[0]
            pre_s.y = r[0]
            s = [pre_s].concat(s)

            var match = new Instruction(Match)
            var pre_r = new Instruction(Jump)
            pre_r.x = match
            r = [pre_r].concat(r)

            return this.join(this.join(s, r), [match])
        } else {
            return s
        }
    }

    class(tree, is_negative) {
        var f = is_negative ? new Instruction(NRange) : new Instruction(Range)
        f.x = []
        f.y = []

        var curr = tree
        while (curr.type === NonTerminal) {
            if (curr.numChildren == 3 || (curr.numChildren == 2 && curr.children[1].type === Terminal)) {
                f.x.push(curr.children[0].terminal.character)
                f.y.push(curr.children[1].terminal.character)
            } else {
                f.x.push(curr.children[0].terminal.character)
                f.y.push(curr.children[0].terminal.character)
            }
            curr = curr.children[curr.numChildren - 1]
        }
        return [f, new Instruction(Match)]
    }

    generate(tree) {
        return this.regex(tree)
    }
}

function codeToString(instructions)
{
    var labels = []
    labels[instructions.length-1] = undefined

    for (var i = 0; i < instructions.length; i++) {
        var instr = instructions[i]
        if (instr.type === Jump || instr.type === Split) {
            labels[instructions.indexOf(instr.x)] = true
        }
        if (instr.type === Split) {
            labels[instructions.indexOf(instr.y)] = true
        }
    }

    var labelCount = 1
    for (var i = 0; i < instructions.length; i++) {
        if (labels[i]) {
            labels[i] = labelCount++
        }
    }

    var str = ""
    for (var i = 0; i < instructions.length; i++) {
        var instr = instructions[i]
        if (labels[i] !== undefined) {
            str += "L" + labels[i] + ":\n"
        }
        switch (instr.type) {
        case Char:
            str += "    char " + instr.c
            break
        case Match:
            str += "    match"
            break
        case Jump:
            str += "    jump L" + labels[instructions.indexOf(instr.x)]
            break
        case Split:
            str += "    split L" + labels[instructions.indexOf(instr.x)]
            str += " L" + labels[instructions.indexOf(instr.y)]
            break
        case Save:
            str += "    save " + instr.s
            break
        case Any:
            str += "    any"
            break
        case Range:
        case NRange:
            str += "    "
            str += instr.type == Range ? "range" : "nrange"
            for (var i = 0; i < instr.x.length; i++) {
                str += " " + instr.x[i] + " " + instr.y[i]
            }
            break
        }
        str += '\n'
    }
    return str
}

class ReVis {
    constructor(expr) {
        var parser = new Parser(expr)
        this.tree = parser.parse()
        console.log(this.tree.toString())
        var generator = new CodeGen()
        this.code = generator.generate(this.tree)
        console.log(this.code)
    }
}

module.exports.ReVis = ReVis
module.exports.codeToString = codeToString
