"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
 *
 * data should be { title, salary, equity, company_handle}
 *
 * Returns { title, salary, equity, company_handle}
 *
 * Throws BadRequestError if company already in database.
 * */
  static async create({ title, salary, equity, companyHandle }) {
    // const duplicateCheck = await db.query(
    //   `SELECT handle
    //        FROM companies
    //        WHERE handle = $1`,
    //   [handle]);

    // if (duplicateCheck.rows[0])
    //   throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO jobs (
          title,
          salary,
          equity,
          company_handle)
          VALUES
             ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle
      ],
    );
    const job = result.rows[0];

    return job;
  }


  /*_buildWhereClause takes in object with up to 3 keys: {title, minSalary, hasEquity}
  Builds a WHERE clause like
  title ILIKE '%'||$1||'%' AND minSalary >= $2 AND equity > 0
  */
  static _buildWhereClause(filters) {

    const keys = Object.keys(filters);

    const cols = keys.map(function (filter, idx) {
      if (filter === "title") {
        return `name ILIKE '%'||$${idx + 1}||'%'`;
      }
      else if (filter === "minSalary") {
        return `salary >= $${idx + 1}`;
      }
      else if (filter === "hasEquity" && filter === true) {
        return `equity > 0`;
      } else {
        throw new BadRequestError("invalid query string key")
      }
    });
    let whereClause = cols.join(" AND ");
    return whereClause;
  }


  /** Find all jobs.
   Takes in optional object with up to 3 keys: {title, minSalary, hasEquity}
  Returns array of all jobs that match the filters,
  or all jobs if no filters passed in:
  [{ title, salary, equity, company_handle}, ...]
   * */

  static async findAll(filters = {}) {
    let whereClause = Job._buildWhereClause(filters);
    const values = Object.values(filters);
    console.log("whereClause = ", whereClause);

    if (whereClause) {
      whereClause = "WHERE " + whereClause;
    }
    const jobRes = await db.query(
      `SELECT title,
                salary,
                equity,
                company_handle AS "companyHandle"              
           FROM jobs
           ${whereClause}
           ORDER BY title`, values);
    return jobRes.rows;
  }

  /** Given a job title, return data about that job.
 *
 * Returns { title, salary, equity, company_handle}
 *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
 *
 * Throws NotFoundError if not found.
 **/


  static async get(id) {
    const jobRes = await db.query(
      `SELECT title,
                salary,
                equity,
                company_handle AS "companyHandle"   
           FROM jobs
           WHERE title = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}}`);

    return job;
  }

  /** Update job data with `data`.
 *
 * This is a "partial update" --- it's fine if data doesn't contain all the
 * fields; this only changes provided ones.
 *
 * Data can include: {title, salary, equity}
 *
 * Returns {title, salary, equity, companyHandle}
 *
 * Throws NotFoundError if not found.
 */



  static async update(id, data) {
    if (data.companyHandle || data.id) throw new BadRequestError("Unable to update company handle or id")
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle"
      });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING title, salary, equity, company_handle as "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
 *
 * Throws NotFoundError if company not found.
 **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);
  }


}


module.exports = Job;