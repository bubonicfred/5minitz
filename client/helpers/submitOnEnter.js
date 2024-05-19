import { $ } from "meteor/jquery";

/**
 * Creates a handler function that prevents the default behavior of the event
 * and executes the provided action when the Enter key is pressed while the Ctrl
 * key is held down.
 *
 * @param {Function} action - The action to be executed when the Enter key is
 *     pressed with Ctrl key.
 * @returns {Function} - The handler function.
 */
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

/**
 * Attaches a keyup event listener to the specified textareas and triggers the
 * provided action.
 *
 * @param {Array} textareas - An array of textarea elements.
 * @param {Function} action - The action to be triggered on keyup event.
 */
export default function (textareas, action) {
  textareas.forEach((input) => {
    $(input).on("keyup", createHandler(action));
  });
}
