"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }


/*_buildWhereClause takes in object with up to 3 keys: {name, min, max}
  Builds a WHERE clause like
  name ILIKE '%'||$1||'%' AND num_employees >= $2 AND num_employees <= $3*/
  static _buildWhereClause(filters) {

    if (filters.maxEmployees && filters.minEmployees) { // be in buildwhereClause
      if (filters.maxEmployees < filters.minEmployees) {
        throw new BadRequestError("max employees must be greater than min employees");
      }
    }
    const keys = Object.keys(filters);

    const cols = keys.map(function (filter, idx) {
      if (filter === "name") {
        return `name ILIKE '%'||$${idx + 1}||'%'`;
      }
      else if (filter === "minEmployees") {
        return `num_employees >= $${idx + 1}`;
      }
      else if (filter === "maxEmployees") {
        return `num_employees <= $${idx + 1}`;
      } else {
        throw new BadRequestError("invalid query string key")
      }
    });
    let whereClause = cols.join(" AND ");
    return whereClause;
  }


  /** Find all companies.
   Takes in object with up to 3 keys: {name, min, max}
  Returns array of all companies that match the filters,
  or all companies if no filters passed in:
  [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters={}) {
    let whereClause = Company._buildWhereClause(filters);
    const values = Object.values(filters);
    console.log("Company.findAll(): whereClause = ", whereClause);

    if (whereClause) {
      whereClause = "WHERE " + whereClause;
    }
    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ${whereClause}
           ORDER BY name`, values);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   *
   * TODO: change return value to include jobs: [ { id, title, salary, equity}, ... ] }
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity
      FROM jobs
      WHERE company_handle = $1`,
      [handle]
    )

    company.jobs = jobsRes.rows
    console.log("Company.get() company= ", company);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
