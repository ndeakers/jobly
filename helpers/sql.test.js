// const jwt = require("jsonwebtoken");
// const { createToken } = require("./tokens");
// const { SECRET_KEY } = require("../config");
const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("test happy path", function () {
  test("works: successfully returned data", function () {
	let jsToSql = {
		firstName: "first_name",
		lastName: "last_name",
		isAdmin: "is_admin",
	  }
	let dataToUpdate = {
		lastName: "XYZ",
		age: 99
	}
	let result = sqlForPartialUpdate(dataToUpdate, jsToSql)
    expect(result).toEqual({
		setCols: '"last_name"=$1, "age"=$2',
		values: ["XYZ", 99]
    });
  });
});

describe("test fail path", function () {
	test("works: successfully throws Error if no dataToUpdate passed in", function () {
	  try{
		let jsToSql = {
		  firstName: "first_name",
		  lastName: "last_name",
		  isAdmin: "is_admin",
		};
	  	let dataToUpdate = {
	  	};
	  	const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
	}
	  catch (err){
		expect(err instanceof BadRequestError).toBeTruthy();
	  }
	});
  });
