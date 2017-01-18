const sysl = require('../sysl_pb');
const pb = require('google-protobuf');
const {parse} = require('./utils');


describe("Sysl Parser", () => {

    it.skip("can parse a simple model", () => {
        const parser = parse('model_simple');
        // TODO: Check results.
    });

    it("can parse the Petshop model", () => {
        const result = parse('model_petshop');
        const apps = result.getAppsMap();
        const app = apps.get('PetShopModel');
        const tables = app.getTypesMap();
        const employee = tables.get('Employee');
        const fields = employee.getRelation().getAttrDefsMap();

        apps.getLength().should.equal(1);
        app.getAttrsMap().get('package').getS().should.equal('io.sysl.demo.petshop.model');
        tables.getLength().should.equal(4);
        fields.getLength().should.equal(4);
        fields.get('employeeId').getPrimitive().should.equal(sysl.Type.Primitive.INT);
    });

});
