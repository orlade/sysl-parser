const {parse} = require('./utils');

describe("Sysl Parser", () => {

    it("can parse a simple model", () => {
        const parser = parse('model_simple');
        // TODO: Check results.
    });

    it("can parse the Petshop model", () => {
        const parser = parse('model_petshop');
        // TODO: Check results.
    });

});
