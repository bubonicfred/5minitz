import { Meteor } from "meteor/meteor";

/**
 * Wraps a Meteor method call in a Promise.
 *
 * @param {string} method - The name of the Meteor method to call.
 * @param {...any} args - The arguments to pass to the Meteor method.
 * @returns {Promise<any>} - A Promise that resolves with the result of the
 *     Meteor method call, or rejects with the error.
 * @deprecated Use Meteor.callCallback instead.
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

/**
 * Wraps a Meteor method with a callback function.
 *
 * @param {string} method - The name of the Meteor method to call.
 * @param {function} callback - The callback function to handle the result or
 *     error.
 * @param {...any} args - The arguments to pass to the Meteor method.
 */
Meteor.callCallback = (method, callback, ...args) => {
  Meteor.call(method, ...args, (error, result) => {
    if (error) {
      callback(error, null);
    } else if (result === undefined) {
      callback(new Error(`No result returned from method ${method}`), null);
    } else {
      callback(null, result);
    }
  });
};
