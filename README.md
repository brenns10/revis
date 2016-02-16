revis
=====

This is a port of my [C regular expression engine][cre] to Javascript.  The
long-term goal is to be able to use this as a browser based visualization and
simulation tool.  I would like my simulation to be able to visualize execution
of bytecode, and also the steps along the way if time allows (lexing, parsing,
code generation).

I'm not really much of a Javascript programmer (yet?).  Add that to the fact
that this is mostly a manual translation of C, and that most of this was done
between the hours of 2AM and 7AM, and this code may be a bit of a horror show.

I'm trying to use ES6 Javascript features in an attempt to get used to them, and
to make it a bit easier on me.

To try this out, I would recommend using node, although you could also load it
in a browser with suitable ES6 support.  Here is an example of how to run this
on node:

```
$ node --harmony
> var revis = require('./revis.js')
undefined
> var re = new revis.ReVis("[a-z]+")
Symbol(REGEX){
 Symbol(SUB){
  Symbol(EXPR){
   Symbol(TERM){
    Symbol(LBracket): '[';
    Symbol(CLASS){
     Symbol(CharSym): 'a';
     Symbol(CharSym): 'z';
    }
    Symbol(RBracket): ']';
   }
   Symbol(Plus): '+';
  }
 }
}
---------------
L1:
    range a z
    split L1 L2
L2:
    match

> re.execute("abc")
{ matchidx: 3, captures: [] }
> re.execute("abcd3")
{ matchidx: 4, captures: [] }
> 
```

You can see that there's still some diagnostic console output.  That'll probably
be removed later.

[cre]: https://github.com/brenns10/regex
