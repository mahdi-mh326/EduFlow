import { z } from "zod";
import { ATTENDANCE_STATUS } from "./attendance.constant.js";

const startAttendanceSchema = z.object({
  body: z.object({
    liveSessionId: z.string().min(1, "Live session is required"),
  }),
});

const submitAttendanceSchema = z.object({
  body: z.object({
    liveSessionId: z.string().min(1, "Live session is required"),
    students: z
      .array(
        z.object({
          studentId: z.string().min(1, "Student is required"),
          status: z.enum(Object.values(ATTENDANCE_STATUS)),
          checkInTime: z.string().transform((val) => new Date(val)).optional(),
          remarks: z.string().trim().optional(),
        })
      )
      .min(1, "At least one student is required"),
  }),
});

const updateAttendanceSchema = z.object({
  body: z
    .object({
      status: z.enum(Object.values(ATTENDANCE_STATUS)).optional(),
      checkInTime: z.string().transform((val) => new Date(val)).optional(),
      remarks: z.string().trim().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update.",
    }),
});

export const AttendanceValidation = {
  startAttendanceSchema,
  submitAttendanceSchema,
  updateAttendanceSchema,
};
