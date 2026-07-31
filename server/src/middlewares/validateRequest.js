import { ZodError } from "zod";
import ApiError from "../shared/ApiError.js";

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        req.body = {};
      }

      const validatedData = await schema.parseAsync({ body: req.body });

      req.body = validatedData.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors[0]?.message || "Validation failed";
        return next(new ApiError(400, message));
      }
      next(error);
    }
  };
};

export default validateRequest;
