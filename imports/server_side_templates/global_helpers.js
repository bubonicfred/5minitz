import { Markdown } from "meteor/perak:markdown";
import { Spacebars } from "meteor/spacebars";
import sanitizeHtml from "sanitize-html"; // Import the sanitize-html package
// Replace <p> tags with <br> to preserve email layout
const PARAGRAPH_REGEX = /<p>(.*?)<\/p>/gi;

/**
 * Sanitizes and formats an HTML string.
 *  Sanitize the HTML to prevent XSS attacks
 * @param {string} html - The HTML string to sanitize and format.
 * @returns {Spacebars.SafeString} - The sanitized and formatted HTML string.
 */
const sanitizeAndFormatHtml = (html) => {
  const brhtml = html.replace(PARAGRAPH_REGEX, "$1<br>");
  const cleanhtml = sanitizeHtml(brhtml);
  return Spacebars.SafeString(cleanhtml);
};
/**
 * Object containing global helper functions for server-side templates.
 *
 * @namespace GlobalHelpers
 */
export const GlobalHelpers = {
  markdown2html(text = "") {
    text = text.toString();
    let html = `<pre>${text}</pre>`;
    try {
      html = Markdown(text);
    } catch (e) {
      console.error(
        `Could( not convert the following markdown to html: ${text}`,
      );
      throw new Error(`Markdown conversion failed: ${e.message}`);
    }

    return sanitizeAndFormatHtml(html);
  },

  doctype() {
    const dt =
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
    return Spacebars.SafeString(dt);
  },

  /**
   * @param {string} filename
   */
  style(filename) {
    //  Assets cannot be imported!
    const style = Assets.getText(filename); // eslint-disable-line
    return Spacebars.SafeString(`<style>${style}</style>`);
  },
};
