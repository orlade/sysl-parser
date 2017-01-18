const sysl = require('../sysl_pb');
const {parse} = require('./utils');

const JsonWriter = require('../JsonWriter');

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
        const employee = tables.get('Employee').getRelation();
        const employeeFields = employee.getAttrDefsMap();
        const tends = tables.get('EmployeeTendsPet').getRelation();
        const tendsFields = tends.getAttrDefsMap();

        apps.getLength().should.equal(1);
        app.getAttrsMap().get('package').getS().should.equal('io.sysl.demo.petshop.model');
        tables.getLength().should.equal(4);

        employee.getPrimaryKey().getAttrNameList().should.eql(['employeeId']);
        employeeFields.getLength().should.equal(4);
        employeeFields.get('employeeId').getPrimitive().should.equal(sysl.Type.Primitive.INT);
        employeeFields.get('employeeId').getAttrsMap().get('autoinc').should.not.be.null;
        employeeFields.get('employeeId').getOpt().should.be.false;
        employeeFields.get('name').getOpt().should.be.true;

        tends.getPrimaryKey().getAttrNameList().should.eql(['employeeId', 'petId']);
        tendsFields.getLength().should.equal(2);
        tendsFields.get('employeeId').getTypeRef().getRef().getPathList().should.eql(['Employee', 'employeeId']);
    });

});
