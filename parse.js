#!/usr/bin/env node

const Parser = require('./parser.js');

const argv = require('minimist')(process.argv.slice(2));

const file = argv._[0];
if (!file) {
    console.error('ERROR: Must provide file');
    process.exit(1);
}
const rule = argv.r || argv.rule || Parser.defaultRule;

const content = require('fs').readFileSync(file, 'utf-8');
const lexerResult = Parser.lexer.tokenize(content);
const parser = new Parser(lexerResult.tokens);
parser[rule]();

if (parser.errors.length) {
    console.error(`${file} is not a valid Sysl model:`);
    const logError = (e) => {
        console.error(` - [${e.token.startLine}:${e.token.startColumn}] ${e.name}: ${e.message}`);
    };
    parser.errors.forEach(logError);
    process.exit(1);
} else {
    console.log(`${file} is a valid Sysl model!`);
}
