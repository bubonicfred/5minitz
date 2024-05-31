import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";

/**
 * Checks a variable against a pattern and throws a Meteor.Error if the check
 * fails.
 * @todo do we need this? is it an improvment over default check behaviour?
 * @param {any} variable - The variable to check.
 * @param {any} pattern - The pattern to check the variable against.
 * @param {string} [message] - An optional error message to include in the
 *     Meteor.Error.
 * @throws {Meteor.Error} If the variable does not match the pattern, and a
 *     message is provided.
 * @throws {Error} If the variable does not match the pattern, and no message is
 *     provided.
 */
export const checkWithMsg = (variable, pattern, message) => {
  try {
    check(variable, pattern);
  } catch (err) {
    if (message) {
      throw new Meteor.Error("Parameter check failed.", message);
    }
    throw err;
  }
};

/**
 * Checks if a given variable is an instance of a specified type.
 *
 * @param {*} variable - The variable to check.
 * @param {Function} type - The type to check against.
 * @throws {Meteor.Error} If the variable is not an instance of the specified
 *     type.
 */
export const instanceCheck = (variable, type) => {
  const isValidSeries = variable instanceof type;

  if (!isValidSeries) {
    throw new Meteor.Error("invalid-type", `Not a valid ${typeof type}`);
  }
};
