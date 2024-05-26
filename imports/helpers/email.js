/**
 * Validates an email address using a regular expression.
 * @returns {boolean} `true` if the input string matches the email address
 *     regular expression, `false` otherwise.
 * @deprecated
 */
export const emailAddressRegExpTest = /^[^\s@]+@([^\s@]+){2,}\.([^\s@]+){2,}$/;
/**
 * A regular expression pattern that matches a valid email address.
 * The pattern matches email addresses in the format:
 * `[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z0-9._-]{2,}`
 * This includes common email address formats like `example@domain.com` and
 * `user.name@subdomain.example.com`.
 * @deprecated
 */
export const emailAddressRegExpMatch =
  /([a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z0-9._-]{2,})/gi;

/**
 * Regular expression pattern for validating email addresses.
 * @type {RegExp}
 */
export const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
/**
 * Checks if the given email is valid.
 *
 * @param {string} email - The email to be validated.
 * @returns {boolean} - Returns true if the email is valid, otherwise false.
 */
export const isValidEmail = (email) => emailRegExp.test(email);
