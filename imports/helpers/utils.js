class _ {
  assignIn = (target, ...sources) => {
    const length = sources.length;
    if (length < 1 || target == null) return target;
    for (let i = 0; i < length; i++) {
      const source = sources[i];
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
}

export { _ };
