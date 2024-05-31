import { Meteor } from "meteor/meteor";

/**
 * Wraps a Meteor method call in a Promise.
 *
 * @param {string} method - The name of the Meteor method to call.
 * @param {...any} args - The arguments to pass to the Meteor method.
 * @returns {Promise<any>} - A Promise that resolves with the result of the
 *     Meteor method call, or rejects with the error.
 * @deprecated Use Meteor.callAsync instead.
 */
Meteor.callPromise = (method, ...args) =>
  new Promise((resolve, reject) => {
    Meteor.call(method, ...args, (error, result) => {
      if (error) {
        reject(error);
      }

      resolve(result);
    });
  });
