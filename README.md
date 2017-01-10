# Sysl Parser

A parser for [Sysl][sysl] specification files based on [Chevrotain][chevrotain].

    npm install --save sysl-parser

## Usage

Import as a library:
   
    var Parser = require('sysl-parser');
    
    var content = require('fs').readFileSync('path/to/file.sysl', 'utf-8');
    
    var tokens = Parser.lexer.tokenize(content);
    var parser = new Parser(tokens);
    parser.modelRule();
    // The results of the parsing will be properties of the parser instance.

Run from the command line:

    npm install -g sysl-parser
    sysl-parser path/to/file.sysl
    
For example:

    $ sysl-parse test/fixtures/model_petshop.sysl 
    test/fixtures/model_petshop.sysl is a valid Sysl model!
    $ sysl-parse test/fixtures/model_invalid.sysl 
    test/fixtures/model_invalid.sysl is not a valid Sysl model:
     - [3:15] MismatchedTokenException: Expecting token of type --> Subset <-- but found --> '=' <--

## References

 - [Sysl][sysl]
 - [Chevrotain][chevrotain]


[sysl]: https://github.com/anz-bank/sysl
[chevrotain]: https://github.com/SAP/chevrotain
