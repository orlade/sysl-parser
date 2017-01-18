const fs = require('fs');
const chai = require('chai');
chai.should();
chai.use(require('chai-subset'));

const Parser = require('../parser.js');

/**
 * Reads in and returns the contents of a fixture file.
 *
 * @param {string} fixture The basename of the fixture file (in test/fixtures).
 * @return {string} The contents of the loaded fixture file.
 */
const load = (fixture) => fs.readFileSync(`test/fixtures/${fixture}.sysl`, 'utf-8');

/**
 * Loads a fixture, lexes it into tokens and creates a parser for the tokens. Ensures there are no
 * lexing errors.
 *
 * @param {string} fixture The path to the fixture file to load.
 * @return {Parser} The parser created for the fixture tokens.
 */
buildParser = (fixture) => {
    const lexerResult = Parser.lexer.tokenize(load(fixture));
    if (lexerResult.errors.length) {
        console.error(lexerResult.errors);
    }
    lexerResult.errors.should.be.empty;
    return new Parser(lexerResult.tokens);
};

/**
 * Creates a parser for a fixture and parses it using a rule. Ensures there are no lexing or parsing
 * errors.
 *
 * @param {string} fixture The path to the fixture file to load.
 * @param {?string} rule The rule to parse the tokens with.
 * @return {object} The result of the parse operation.
 */
parse = (fixture, rule = Parser.defaultRule) => {
    const parser = buildParser(fixture);
    const result = parser[rule]();
    parser.errors.should.be.empty;
    return result;
};

module.exports = {
    load,
    buildParser,
    parse
};
