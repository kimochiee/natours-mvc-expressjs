module.exports = (func) => {
  return (req, res, next) => {
    //return ở đây trả về 1 anonymous function
    func(req, res, next).catch(next);
  };
};
