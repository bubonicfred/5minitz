import { T9n } from "meteor-accounts-t9n";
import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

/**
 * Retrieves the canonical locale codes for the supported locales, this array is
 * taken from the current translation files and should be updated if new
 * languages ares added.
 * @returns {string[]} An array of canonical locale codes.
 */
const getLocaleCodes = () => {
  const locales = [
    "af",
    "ar",
    "ca",
    "cs",
    "da",
    "de",
    "de-LI",
    "el",
    "en",
    "es",
    "fi",
    "fr",
    "he",
    "hi",
    "hu",
    "it",
    "ja",
    "ko",
    "nl",
    "no",
    "pl",
    "pt",
    "pt-BR",
    "ro",
    "ru",
    "sr",
    "sr",
    "sv",
    "tr",
    "uk",
    "vi",
    "zh-CN",
    "zh-TW",
  ];
  return Intl.getCanonicalLocales(locales);
};
// Special case disabled until rest of code is confirmed to work
// if (code.toLowerCase() === "de-li") {
//   return {
//     code,
//     codeUI: "de-Fr",
//     name: "German (Franconian)",
//     nameNative: "Deutsch (Fränggisch)",
// Only server can provide all available languages via server-side method
Meteor.methods({
  /**
   * Retrieves the available locales.
   *
   * @returns {Array} An array of locale objects containing the code, codeUI,
   *     name, and nameNative properties.
   */
  getAvailableLocales() {
    // [{code: "el", name: "Greek", nameNative: "Ελληνικά"}, ...]
    const languageNamesInEnglish = new Intl.DisplayNames(["en"], {
      type: "language",
    });
    const languageNamesInNativeLanguage = {};

    const localeCodes = getLocaleCodes();

    /**
     * Returns a locale object based on the provided code.
     *
     * @param {string} code - The code representing the locale.
     * @returns {Object} The locale object containing the code, codeUI, name,
     *     and nameNative properties.
     */
    const getLocaleObject = (code) => {
      languageNamesInNativeLanguage[code] = new Intl.DisplayNames([code], {
        type: "language",
      });
      return {
        code,
        codeUI: code,
        name: languageNamesInEnglish.of(code),
        nameNative: languageNamesInNativeLanguage[code].of(code),
      };
    };
    return localeCodes.map(getLocaleObject);
  },
  getAvailableLocaleCodes() {
    // ["el", "de", "zh-CN", "zh-TW"]
    return getLocaleCodes();
  },
});

export class I18nHelper {
  /**
   * Array of supported language codes.
   *
   * @type {Array<string>}
   */
  static supportedCodes = [];

  // setLanguageLocale() has two modes:
  // 1. No locale given
  //      => determine preference (first user, then browser)
  // 2. Given locale (e.g., 'en-US')
  //      => store this in user profile (if not demo user)
  // Finally: set it in i18n
  static async setLanguageLocale(localeCode) {
    if (I18nHelper.supportedCodes.length === 0) {
      // cache the supported languages
      try {
        I18nHelper.supportedCodes = await Meteor.callAsync(
          "getAvailableLocaleCodes",
        );
      } catch (err) {
        console.log(
          "Error callAsync(getAvailableLocaleCodes): No supported language locales reported by server.",
        );
      }
    }

    if (localeCode) {
      I18nHelper._persistLanguagePreference(localeCode);
    } else {
      localeCode = I18nHelper._getPreferredUserLocale();
    }
    console.log(`Switch to language locale: >${localeCode}<`);
    if (localeCode === "auto") {
      localeCode = I18nHelper._getPreferredBrowserLocale();
      console.log(` Browser language locale: >${localeCode}<`);
    }

    i18n
      .setLocale(localeCode)
      .then(() => T9n.setLanguage(localeCode))
      .catch((e) => {
        console.log(`Error switching to: >${localeCode}<`);
        console.error(e);
        const fallbackLocale = "en-US";
        console.log(`Switching to fallback: >${fallbackLocale}<`);
        i18n.setLocale(fallbackLocale);
        T9n.setLanguage(fallbackLocale);
      });
  }

  /**
   * Get the language locale for the current user.
   * If the user is not logged in or the locale is not set, "auto" will be
   * returned.
   * @returns {string} The language locale.
   */
  static getLanguageLocale() {
    if (
      !Meteor.user() ||
      !Meteor.user().profile ||
      !Meteor.user().profile.locale
    ) {
      return "auto";
    }
    return i18n.getLocale();
  }

  /**
   * Returns the preferred user locale.
   * If the application is running in an end-to-end test mode, it returns
   * "en-US". Otherwise, it checks the user's profile locale, and if not
   * available, falls back to the preferred browser locale.
   *
   * @returns {string} The preferred user locale.
   */
  static _getPreferredUserLocale() {
    if (Meteor.settings?.public && Meteor.settings.public.isEnd2EndTest) {
      return "en-US";
    }
    return (
      (Meteor.user() &&
        Meteor.user().profile &&
        Meteor.user().profile.locale) ||
      I18nHelper._getPreferredBrowserLocale()
    );
  }

  /**
   * Returns the preferred browser locale.
   * If running in an end-to-end test environment, it returns "en-US".
   * Otherwise, it tries to determine the preferred browser locale based on the
   * following priorities:
   * 1. Locale determined by I18nHelper._getPreferredBrowserLocaleByPrio()
   * 2. navigator.language
   * 3. navigator.browserLanguage
   * 4. navigator.userLanguage
   * If none of the above are available, it defaults to "en-US".
   *
   * @returns {string} The preferred browser locale.
   */
  static _getPreferredBrowserLocale() {
    if (Meteor.settings.isEnd2EndTest) {
      return "en-US";
    }

    return (
      I18nHelper._getPreferredBrowserLocaleByPrio() ||
      navigator.language ||
      navigator.browserLanguage ||
      navigator.userLanguage ||
      "en-US"
    );
  }

  /**
   * Retrieves the preferred browser locale based on priority.
   * @returns {string|undefined} The preferred browser locale or undefined if no
   *     browser language is supported.
   */
  static _getPreferredBrowserLocaleByPrio() {
    if (!navigator.languages || !navigator.languages[0]) {
      return undefined; // no browser language, so we can't support any
    }

    // console.log('4Minitz:', I18nHelper.supportedCodes);  // plz. keep for
    // debugging
    const supported = {};
    I18nHelper.supportedCodes.forEach((code) => {
      supported[code] = code; // remember we support: 'de-CH'
      const codeShort = code.split("-", 1)[0];
      if (!supported[codeShort]) {
        supported[codeShort] = code; // remember we support: 'de' via 'de-CH'
      }
    });
    // console.log('Browser:', navigator.languages);        // plz. keep for
    // debugging
    for (const code of navigator.languages) {
      // First try: use exact codes from browser
      if (supported[code]) {
        // 'de-DE'
        return supported[code];
      }
      const codeShort = code.split("-", 1)[0]; // 'de'
      if (supported[codeShort]) {
        // Second try: use prefix codes from browser
        return supported[codeShort]; // but return the more precise 'de-CH'
      }
    }
    return undefined; // we don't support any preferred browser languages
  }

  /**
   * Persists the language preference for the current user.
   *
   * @param {string} localeCode - The locale code representing the language
   *     preference.
   * @returns {void}
   */
  static _persistLanguagePreference(localeCode) {
    if (!Meteor.user() || Meteor.user().isDemoUser) {
      return;
    }
    if (localeCode === "auto") {
      Meteor.users.update(
        { _id: Meteor.userId() },
        { $unset: { "profile.locale": "" } },
      );
    } else {
      Meteor.users.update(
        { _id: Meteor.userId() },
        { $set: { "profile.locale": localeCode } },
      );
    }
  }
}
export { getLocaleCodes };
