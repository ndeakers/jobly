"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 5000,
    equity: 0,
    companyHandle: 'c1',
  };

  // const resultJob = {
  //   id: ,
  //   title: "new",
  //   salary: 5000,
  //   equity: "0",
  //   companyHandle: 'c1',
  // };

  test("works", async function () {
    let job = await Job.create(newJob);
    console.log("job is", job)

    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 5000,
      equity: "0",
      companyHandle: 'c1',
    });


    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = '${job.id}'`);
    expect(result.rows[0]).toEqual(
      {
        id: expect.any(Number),
        title: "new",
        salary: 5000,
        equity: "0",
        companyHandle: 'c1'
      },
    );
  });

  // test("bad request with dupe", async function () {
  //   try {
  //     await Company.create(newCompany);
  //     await Company.create(newCompany);
  //     fail();
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });
});