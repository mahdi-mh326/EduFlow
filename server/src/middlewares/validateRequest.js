const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
      });

      req.body = validatedData.body;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;