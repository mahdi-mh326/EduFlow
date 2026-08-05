import Counter from "./counter.model.js";
import ApiError from "../../shared/ApiError.js";

const getNextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true }
  );

  if (!counter) throw new ApiError(500, `Failed to generate sequence for "${name}"`);

  return counter.sequence;
};

export const CounterService = { getNextSequence };
