export const resizeTextarea = (element) => {
  const scrollPos = window.scrollY;
  if (element.css) {
    element.css("height", "auto");
    element.css("height", `${element.prop("scrollHeight")}px`);
  }
  window.scrollTo(0, scrollPos);
};
