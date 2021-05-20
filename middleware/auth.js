"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    console.log("authHeader", authHeader);
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
      console.log("what is res.locals.user", res.locals.user);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError("Must be logged in");
    return next();
  } catch (err) {
    return next(err);
  }
}

/*
 * Middleware to use when they must be an admin .
 * If not, raises Unauthorized.
 */
function ensureIsAdmin(req, res, next) {
  try {
    if (!res.locals.user.isAdmin === true) throw new UnauthorizedError("Admins only");
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Middleware to ensure user is admin or the owner of account being modified
 * If not, raises unauthorized.
 */
function ensureIsAdminOrOwner(req, res, next) {
  console.log("req.params", req.params);
  try {
    if ((res.locals.user.isAdmin === true) ||
      (res.locals.user.username && res.locals.user.username === req.params.username)) {
      return next();
    }
    throw new UnauthorizedError("Unauthorized");
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureIsAdmin,
  ensureIsAdminOrOwner
};
