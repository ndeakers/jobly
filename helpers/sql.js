const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * Function assembles a portion of the sql query string that will perform a partial update
 * to a db record
 * by taking in JavaScript data that will be updated and translating that data into a string
 * that can be used in an sql query.
 *
 takes in dataToUpdate as an object of properties to update on the class instance like:
 { propertyName: newValue, propertyName2: newValue2}
 and jsToSql is an object that translates the name of the js object key to the sql
 table column name like:
 {firstName: 'first_name'}

 returns: an object containing the query-string-portion and an array of variables that will
 be represented in the query sting with the $ operator, like:
 { setCols: '"first_name"=$1, "age"=$2', values: [newName, 30]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  console.log("dataToUpdate= ", dataToUpdate);
  console.log("jstosql = ", jsToSql);
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
