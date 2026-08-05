import { CounterService } from "../counter/counter.service.js";

const generateTeacherEmployeeId = async () => {
  const year = new Date().getFullYear();
  const sequence = await CounterService.getNextSequence("teacher");
  return `TCH-${year}-${String(sequence).padStart(4, "0")}`;
};

export const teacherUtils = { generateTeacherEmployeeId };
