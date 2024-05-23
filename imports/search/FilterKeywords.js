/**
 * Checks if a given token represents a valid keyword.
 *
 * @param {string} token - The token to check.
 * @returns {boolean} - `true` if the token is a valid keyword, `false`
 *     otherwise.
 */
const isKeyword = function (token) {
  if (this.USER && token.startsWith(this.USER.key)) {
    return true;
  }
  const arr = token.split(":");
  return arr.length === 2 && this.isAllowedValueForKey(arr[0], arr[1]);
};

/**
 * Extracts a keyword and associated value from a given token.
 *
 * If the token starts with the user's key, the key is set to the user's key and
 * the value is the remainder of the token. If the token contains a colon, the
 * key is set to the part before the colon and the value is the part after the
 * colon. If the value is "me", it is set to an empty string. If a
 * queryUserIdByName function is provided, the function is used to retrieve IDs
 * associated with the value.
 *
 * @param {string} token - The token to extract the keyword and value from.
 * @param {function} [queryUserIdByName] - An optional function to retrieve IDs
 *     associated with the value.
 * @returns {object} - An object containing the extracted key, value, and
 *     associated IDs.
 */
const getKeyWordFromToken = function (token, queryUserIdByName) {
  let key;
  let value;
  let ids = [];
  if (this.USER && token.startsWith(this.USER.key)) {
    key = this.USER.key;
    value = token.substring(1);
    if (queryUserIdByName) {
      ids = queryUserIdByName(value);
      if (value === "me") {
        value = "";
      }
    }
  } else {
    const arr = token.split(":");
    key = arr[0];
    value = arr[1];
  }
  return {
    key,
    value,
    ids,
  };
};

const isAllowedValueForKey = function (key, value) {
  key = key.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(this, key)) {
    const values = this[key].values;
    return values === "*" || values.includes(value);
  }
  return false;
};

export const ITEM_KEYWORDS = {
  IS: {
    key: "is",
    values: ["open", "closed", "info", "action", "new", "sticky"],
    format: "is:<property>",
    description: "Finds items which have the specified property.",
    example: '"is:open is:action" finds all open action items.',
  },
  DO: {
    key: "do",
    values: ["match-case"],
    format: "do:<value>",
    description: "Specifies how the search will be applied.",
    example: '"do:match-case" turns on the case sensitive search.',
  },
  PRIO: {
    key: "prio",
    values: "*",
    format: "prio:<value>",
    description: "Finds items which have the given priority.",
    example: '"prio:HIGH" finds items with the priority "HIGH"',
  },
  DUE: {
    key: "due",
    values: "*",
    format: "due:<YYYY-MM-DD>",
    description: "Finds action items which are due on the given date.",
    example:
      '"due:2017-07" finds all action items which are due in july of 2017',
  },
  USER: {
    key: "@",
    values: "*",
    format: "@<username>",
    description: "Finds all action items assigned to the given user.",
    example: '"@john" finds all action items assigned to the user john',
  },

  isKeyword,

  getKeyWordFromToken,

  isAllowedValueForKey,
};

export const TOPIC_KEYWORDS = {
  IS: {
    key: "is",
    values: ["uncompleted", "completed", "new"],
    format: "is:<property>",
    description: "Finds topics which have the specified property.",
    example: '"is:new is:uncompleted" finds all new uncompleted (open) topics.',
  },
  HAS: {
    key: "has",
    values: ["item", "action", "info"],
    format: "has:<type>",
    description: "Finds topics which contain items of the specified type.",
    example: '"has:action" finds topics which have action items.',
  },
  DO: {
    key: "do",
    values: ["match-case"],
    format: "do:<value>",
    description: "Specifies how the search will be applied.",
    example: '"do:match-case" turns on the case sensitive search.',
  },
  USER: {
    key: "@",
    values: "*",
    format: "@username",
    description: "Finds all action items assigned to the given user.",
    example: '"@john" finds all topics assigned to the user john',
  },

  isKeyword,

  getKeyWordFromToken,

  isAllowedValueForKey,
};
