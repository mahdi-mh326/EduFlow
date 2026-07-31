const sendResponse = (
  res,
  {
    statusCode = 200,
    success = true,
    message = "",
    data = null,
    meta = null,
  }
) => {
  return res.status(statusCode).json({
    success,
    message,
    meta,
    data,
  });
};

export default sendResponse;