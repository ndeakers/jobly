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
      }
    );
  });
});


//   test("fails on incomplete data", async function () {
//     const newJob = {
//       salary: 5000,
//       equity: 0,
//       companyHandle: 'c1',
//     };
//     let job = await Job.create(newJob);
//     expect(job)
//   })
// });

// test("bad request with dupe", async function () {
//   try {
//     await Job.create(newCompany);
//     await Job.create(newCompany);
//     fail();
//   } catch (err) {
//     expect(err instanceof BadRequestError).toBeTruthy();
//   }
// });


/************************************** _buildWhereClause */

describe("_whereClauseBuilder", function () {
  test("works with three inputs", async function () {
    let filters = { title: "j", minSalary: 1, hasEquity: true }
    let whereClause = await Job._buildWhereClause(filters);
    console.log("whereclause = ", whereClause);
    expect(whereClause).toEqual("title ILIKE '%'||$1||'%' AND salary >= $2 AND equity > 0")
  });

  test("works with one", async function () {
    let filters = { title: "j" }
    let whereClause = await Job._buildWhereClause(filters);
    expect(whereClause).toEqual("title ILIKE '%'||$1||'%'");
  });

  test("works with two", async function () {
    let filters = { title: "j", minSalary: 1 }
    let whereClause = await Job._buildWhereClause(filters);
    expect(whereClause).toEqual("title ILIKE '%'||$1||'%' AND salary >= $2");
  });

  test("should throw error with invalid input", async function () {
    try {
      let filters = { badInput: "C" }
      let whereClause = await Job._buildWhereClause(filters);
      console.log("whereClause for bad input", whereClause)
      fail();
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** buildValuesArray */
describe("_buildValuesArray", function () {
  test("works with title, minSalary", async function () {
    let filters = { title: "j", minSalary: 1 }
    let values = await Job._buildValuesArray(filters);
    expect(values).toEqual(["j", 1]);
  });
  test("works with title, minSalary", async function () {
    let filters = { title: "j", minSalary: 1, hasEquity: true }
    let values = await Job._buildValuesArray(filters);
    expect(values).toEqual(["j", 1]);
  });
  test("works with just has Equity", async function () {
    let filters = { hasEquity: true }
    let values = await Job._buildValuesArray(filters);
    expect(values).toEqual([]);
  });
});




/************************************** findAll */
// ('j1', 100, 0, 'c1'),
// ('j2', 200, 0.5, 'c2')
describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.5",
        companyHandle: "c2",
      }
    ]);
  });
});

describe("findAll with Filter", function () {
  test("works", async function () {
    let filters = { title: "j", minSalary: 1, hasEquity: true }
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.5",
        companyHandle: "c2",
      }
    ])
  });

  test("correctly fails to find job that matches filters", async function () {
    let filters = { title: "CEO", minSalary: 100, hasEquity: true };
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([]);
  });

  test("finds all if empty object passed in", async function () {
    let filters = {};
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200,
        equity: "0.5",
        companyHandle: "c2",
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {

    let id = await db.query(`INSERT INTO jobs(title,
      salary,
      equity,
      company_handle)
      VALUES ('j3', 1000, 0, 'c1')
      RETURNING id`);

    id = id.rows[0].id;
    console.log("This is ID", id)

    let job = await Job.get(id);
    expect(job).toEqual({
      id,
      title: "j3",
      salary: 1000,
      equity: "0",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-10000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
