import jQuery from "jquery";
import _ from "lodash";

window.$ = window.jQuery = jQuery;

function createHandler(action) {
  return (event) => {
    event.preventDefault();

    const ctrl = event.ctrlKey;
    let enterWasPressed = event.key === "Enter";

    // for browsers that do not support event.key yet
    enterWasPressed |= event.keyCode === 13;

    if (ctrl && enterWasPressed) {
      action();
    }
  };
}

export default function (textareas, action) {
  _.forEach(textareas, (input) => {
    window.$(input).on("keyup", createHandler(action));
  });
}
