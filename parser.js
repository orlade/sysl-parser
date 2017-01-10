const chevrotain = require('chevrotain');

module.exports = (function syslGrammer() {
    // Written Docs for this tutorial step can be found here:
    // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md

    // Tutorial Step 2:

    // Adding a Parser (grammar only, only reads the input
    // without any actions) using the Tokens defined in the previous step.
    // modification to the grammar will be displayed in the syntax diagrams panel.

    const createToken = (name, pattern) => chevrotain.createToken({name, pattern});
    const Lexer = chevrotain.Lexer;
    const Parser = chevrotain.Parser;

    // Strings
    const Namespace = createToken("Namespace", /[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+/);
    const Identifier = createToken("Identifier", /[A-Z]\w*/);
    const SmallIdentifier = createToken("SmallIdentifier", /[a-z]\w*/);
    const TableName = createToken("TableName", /!table/);

    // Types
    const ForeignKeyType = createToken("ForeignKeyType", /[A-Z]\w*\.\w+/);
    const IntType = createToken("IntType", /int/);
    const DecimalType = createToken("DecimalType", /decimal/);
    const StringType = createToken("StringType", /string/);
    const DateType = createToken("DateType", /date/);

    // Symbols
    const Colon = createToken("Colon", /:/);
    const Comma = createToken("Comma", /,/);
    const DoubleQuote = createToken("DoubleQuote", /"/);
    const Equals = createToken("Equals", /=/);
    const LSquare = createToken("LSquare", /\[/);
    const RSquare = createToken("RSquare", /\]/);
    const QuestionMark = createToken("QuestionMark", /\?/);
    const Subset = createToken("Subset", /<:/);
    const Tilde = createToken("Tilde", /~/);
    const WhiteSpace = createToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED;

    // whitespace is normally very common so it is placed first to speed up the lexer
    const allTokens = [
        WhiteSpace,

        TableName,

        ForeignKeyType,
        IntType,
        DecimalType,
        StringType,
        DateType,

        Namespace,
        SmallIdentifier,
        Identifier,

        Subset,
        Colon,
        Comma,
        DoubleQuote,
        Equals,
        LSquare,
        RSquare,
        QuestionMark,
        Tilde,
    ];
    const ModelLexer = new Lexer(allTokens);


    // ----------------- parser -----------------

    function ModelParser(input, config) {
        if (typeof input === 'string') {
            const lexerResult = Parser.lexer.tokenize(input);
            if (lexerResult.errors.length) throw Error("Failed to tokenize input content");
            input = lexerResult.tokens;
        }
        // By default if {recoveryEnabled: true} is not passed in the config object
        // error recovery / fault tolerance capabilities will be disabled
        Parser.call(this, input, allTokens, config);
        const $ = this;

        this.modelRule = $.RULE('modelRule', function() {
            $.CONSUME(Identifier);
            $.OPTION(function() {
                $.SUBRULE($.modelAttrs);
            });
            $.CONSUME(Colon);
            $.MANY(function() {
                $.SUBRULE($.tableStatement);
                $.MANY2(function() {
                    $.SUBRULE($.fieldStatement);
                });
            })
        });

        this.attrStatement = $.RULE('attrStatement', function() {
            $.CONSUME(SmallIdentifier);
            $.CONSUME(Equals);
            $.CONSUME(DoubleQuote);
            $.CONSUME(Namespace);
            $.CONSUME2(DoubleQuote);
        });

        this.modelAttrs = $.RULE('modelAttrs', function() {
            $.CONSUME(LSquare);
            $.OPTION(function() {
                $.SUBRULE($.attrStatement);
                $.MANY(function() {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.attrStatement);
                });
            });
            $.CONSUME(RSquare);
        });

        this.tableStatement = $.RULE('tableStatement', function() {
            $.CONSUME(TableName);
            $.CONSUME(Identifier);
            $.CONSUME(Colon);
        });

        this.fieldStatement = $.RULE('fieldStatement', function() {
            $.CONSUME(SmallIdentifier);
            $.CONSUME(Subset);
            $.SUBRULE($.typeStatement);
            $.OPTION(function() {
                $.CONSUME(QuestionMark);
            });
            $.OPTION2(function() {
                $.SUBRULE($.fieldAttrs);
            });
        });

        this.fieldAttrs = $.RULE('fieldAttrs', function() {
            $.CONSUME(LSquare);
            $.OPTION(function() {
                $.SUBRULE($.fieldAttr);
                $.MANY(function() {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.fieldAttr);
                });
            });
            $.CONSUME(RSquare);
        });

        this.fieldAttr = $.RULE('fieldAttr', function() {
            $.OPTION(function() {
                $.CONSUME(Tilde);
            });
            $.CONSUME(SmallIdentifier);
        });

        this.typeStatement = $.RULE('typeStatement', function() {
            $.OR([
                {
                    ALT: function() {
                        $.CONSUME(IntType)
                    }
                },
                {
                    ALT: function() {
                        $.CONSUME(DecimalType)
                    }
                },
                {
                    ALT: function() {
                        $.CONSUME(StringType)
                    }
                },
                {
                    ALT: function() {
                        $.CONSUME(DateType)
                    }
                },
                {
                    ALT: function() {
                        $.CONSUME(ForeignKeyType)
                    }
                },
            ], "a type");
            $.OPTION(function() {
                $.CONSUME(QuestionMark);
            })
        });

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    ModelParser.prototype = Object.create(Parser.prototype);
    ModelParser.prototype.constructor = ModelParser;

    ModelParser.lexer = ModelLexer;
    ModelParser.defaultRule = "modelRule";

    return ModelParser;
}());
