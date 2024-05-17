/**
 * Validates an email address using a regular expression.
 * @returns {boolean} `true` if the input string matches the email address
 *     regular expression, `false` otherwise.
 */
export const emailAddressRegExpTest = /^[^\s@]+@([^\s@]+){2,}\.([^\s@]+){2,}$/;
/**
 * A regular expression pattern that matches a valid email address.
 * The pattern matches email addresses in the format:
 * `[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z0-9._-]{2,}`
 * This includes common email address formats like `example@domain.com` and
 * `user.name@subdomain.example.com`.
 */
export const emailAddressRegExpMatch =
  /([a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z0-9._-]{2,})/gi;
