const chevrotain = require('chevrotain');
const sysl = require('sysl-proto');
const {build, setField, assign, onlyKey, only} = require('./protobuf-factory')(sysl);

module.exports = (function syslGrammar() {
    // Written Docs for this tutorial step can be found here:
    // https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md

    // Tutorial Step 2:

    // Adding a Parser (grammar only, only reads the input
    // without any actions) using the Tokens defined in the previous step.
    // modification to the grammar will be displayed in the syntax diagrams panel.

    const createToken = (name, pattern, longer_alt) =>
        chevrotain.createToken({name, pattern, longer_alt});
    const Lexer = chevrotain.Lexer;
    const Parser = chevrotain.Parser;

    // Strings
    const Namespace = createToken("Namespace", /[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+/);
    const Identifier = createToken("Identifier", /[A-Z]\w*/);
    const SmallIdentifier = createToken("SmallIdentifier", /[a-z]\w*/);

    // Types
    const ForeignKeyType = createToken("ForeignKeyType", /[A-Z]\w*\.\w+/);
    const IntType = createToken("IntType", /int/);
    const DecimalType = createToken("DecimalType", /decimal/);
    const StringType = createToken("StringType", /string/);
    const DateType = createToken("DateType", /date/);

    const TypeDecl = createToken("TypeDecl", /!type/);
    const TableDecl = createToken("TableDecl", /!table/);
    const EnumDecl = createToken("EnumDecl", /!enum/);

    const ViewDecl = createToken("ViewDecl", /!view/);
    const EndpointDecl = createToken("EndpointDecl", /\/\w+/);

    const MethodDecl = createToken("MethodDecl", /(?:GET|POST|PUT|DELETE)/, Identifier);

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

        ForeignKeyType,
        IntType,
        DecimalType,
        StringType,
        DateType,

        TypeDecl,
        TableDecl,
        EnumDecl,
        ViewDecl,
        EndpointDecl,
        MethodDecl,

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


    const typeNameMap = {
        '!table': 'Type.Relation',
        '!view': 'View',
        '!type': 'Type',
    };

    const typeFieldNameMap = {
        '!table': 'relation',
        '!view': 'view',
        '!type': 'type',
    };

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


        this.moduleSpec = $.RULE('moduleSpec', () => {
            const module = build('Module');
            const appsMap = module.getAppsMap();
            const apps = $.MANY(() => $.SUBRULE($.appSpec));
            apps.forEach(app => appsMap.set([app.getName().getPartList()[0]], app));
            return module;
        });

        this.appSpec = $.RULE('appSpec', () => {
            const app = build('Application');
            setField(app, 'name', build('AppName')).addPart($.CONSUME(Identifier).image);
            assign(app, 'attrsMap', $.OPTION(() => $.SUBRULE($.attributeSpec)), 'values');

            $.CONSUME(Colon);

            $.MANY(() => $.SUBRULE($.modulePartSpec)).forEach(part => {
                assign(app, `${only(part)._type.toLowerCase()}sMap`, [part]);
            });

            return app;
        });

        this.attributeSpec = $.RULE('attributeSpec', () => {
            $.CONSUME(LSquare);
            const result = $.MANY_SEP(Comma, () => $.SUBRULE($.attrStatement));
            $.CONSUME(RSquare);
            return result;
        });

        this.modulePartSpec = $.RULE('modulePartSpec', () => $.OR([
            {ALT: () => $.SUBRULE1($.typeSpec)},
            {ALT: () => $.SUBRULE2($.endpointSpec)},
        ]));

        this.typeSpec = $.RULE('typeSpec', () => {
            const type = build('Type');

            const metatype = $.SUBRULE($.typeDeclStatement);
            const oneOf = setField(type, typeFieldNameMap[metatype], build(typeNameMap[metatype]));

            const name = $.CONSUME(Identifier).image;
            $.CONSUME(Colon);

            // TODO: Other types
            setField(type, 'relation', $.SUBRULE($.relationSpec));
            return {[name]: type};
        });

        this.relationSpec = $.RULE('relationSpec', () => {
            const relation = build('Type.Relation');

            const attrDefs = $.MANY(() => $.SUBRULE($.fieldStatement));
            assign(relation, 'attrDefsMap', attrDefs);

            const pks = attrDefs.filter(o => only(o).getAttrsMap().get('pk')).map(onlyKey);
            setField(relation, 'primaryKey', build('Type.Relation.Key', {attrNameList: pks}));
            return relation;
        });

        this.typeDeclStatement = $.RULE('typeDeclStatement', () => $.OR([
            {ALT: () => $.CONSUME(TypeDecl)},
            {ALT: () => $.CONSUME(TableDecl)},
            {ALT: () => $.CONSUME(EnumDecl)},
        ]).image);

        this.fieldStatement = $.RULE('fieldStatement', () => {
            const name = $.CONSUME(SmallIdentifier).image;
            $.CONSUME(Subset);
            const [key, value] = $.SUBRULE($.typeStatement);
            const type = build('Type', {[key]: value});

            type.setOpt(!!$.OPTION(() => $.CONSUME(QuestionMark)));
            const attrs = $.OPTION2(() => $.SUBRULE($.fieldAttrs));
            attrs && assign(type, 'attrsMap', attrs);
            return {[name]: type};
        });

        this.typeStatement = $.RULE('typeStatement', () => {
            return $.OR([
                {ALT: () => $.CONSUME(IntType) && ['primitive', sysl.Type.Primitive.INT]},
                {ALT: () => $.CONSUME(DecimalType) && ['primitive', sysl.Type.Primitive.DECIMAL]},
                {ALT: () => $.CONSUME(StringType) && ['primitive', sysl.Type.Primitive.STRING]},
                {ALT: () => $.CONSUME(DateType) && ['primitive', sysl.Type.Primitive.DATE]},
                {
                    ALT: () => {
                        const sref = build('ScopedRef', {ref: build('Scope')});
                        setField(sref.getRef(), 'pathList', $.CONSUME(ForeignKeyType).image.split('.'));
                        return ['typeRef', sref];
                    }
                },
            ], "a type");
        });

        this.fieldAttrs = $.RULE('fieldAttrs', () => {
            $.CONSUME(LSquare);
            const attrNames = $.MANY_SEP(Comma, () => $.SUBRULE($.fieldAttr)).values;
            $.CONSUME(RSquare);
            return attrNames.map(name => ({[name]: build('Attribute')}));
        });

        this.fieldAttr = $.RULE('fieldAttr', () => {
            $.OPTION(() => $.CONSUME(Tilde));
            return $.CONSUME(SmallIdentifier).image;
        });

        this.endpointSpec = $.RULE('endpointSpec', () => {
            const endpoint = build('Endpoint');
            const params = setField(endpoint, 'restParams', build('Endpoint.RestParams'));
            const name = $.SUBRULE($.endpointDeclStatement).substr(1);
            setField(params, 'method', sysl.Endpoint.RestParams.Method[$.CONSUME(MethodDecl).image]);
            $.CONSUME(Colon);
            return {[name]: endpoint};
        });

        this.endpointDeclStatement = $.RULE('endpointDeclStatement', () => {
            const endpoint = $.CONSUME(EndpointDecl).image;
            $.CONSUME(Colon);
            return endpoint;
        });

        this.viewSpec = $.RULE('viewSpec', () => {
        });

        this.attrStatement = $.RULE('attrStatement', () => {
            const attr = build('Attribute');
            const key = $.CONSUME(SmallIdentifier).image;
            $.CONSUME(Equals);
            $.CONSUME(DoubleQuote);
            setField(attr, 's', $.CONSUME(Namespace).image);
            $.CONSUME2(DoubleQuote);
            return {[key]: attr};
        });

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    ModelParser.prototype = Object.create(Parser.prototype);
    ModelParser.prototype.constructor = ModelParser;

    ModelParser.lexer = ModelLexer;
    ModelParser.defaultRule = 'moduleSpec';

    return ModelParser;
}());
