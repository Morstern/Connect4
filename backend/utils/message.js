const encapsulateMessage = (...args) => {
  return args.reduce((total, arg) => {
    return total + ':' + arg;
  });
};

const decapsulateMessage = (string) => {
  return string.split(':');
};

module.exports = {encapsulateMessage, decapsulateMessage};
