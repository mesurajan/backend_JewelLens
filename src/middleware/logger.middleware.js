// src/middleware/logger.middleware.js
const requestLogger = (req, res, next) => {
  console.log("======================================");
  console.log(`Method : ${req.method}`);
  console.log(`URL    : ${req.originalUrl}`);
  console.log(`Body   : ${JSON.stringify(req.body)}`);
  console.log(`Query  : ${JSON.stringify(req.query)}`);
  console.log(`Params : ${JSON.stringify(req.params)}`);
  console.log("======================================\n");
  next();
};

export default requestLogger;