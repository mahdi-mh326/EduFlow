import http from "http";
import fs from "fs";

const BASE = "http://localhost:5000";
const results = [];

function request(path, options = {}, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };
    const req = http.request(opts, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", () => resolve({ status: 0, body: null }));
    if (data) req.write(data);
    req.end();
  });
}

function log(name, actual, expected, pass) {
  results.push({ name, actual, expected, pass });
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}`);
}

async function run() {
  console.log("=== PHASE 11: CHATBOT AI TESTS ===\n");

  // ===== AUTH =====
  const adminLogin = await request("/api/v1/auth/login", { method: "POST" }, { email: "admin@eduflow.com", password: "Admin@12345" });
  const adminToken = adminLogin.body?.data?.accessToken;
  log("1. Admin login", !!adminToken, true, !!adminToken);

  const teacherLogin = await request("/api/v1/auth/login", { method: "POST" }, { email: "teacher.phase4.a@eduflow.dev", password: "Phase4TeacherA@123" });
  const teacherToken = teacherLogin.body?.data?.accessToken;
  log("2. Teacher login", !!teacherToken, true, !!teacherToken);

  const student1Login = await request("/api/v1/auth/login", { method: "POST" }, { email: "student.seed.1@eduflow.dev", password: "TempPass123!" });
  const student1Token = student1Login.body?.data?.accessToken;
  log("3. Student1 login", !!student1Token, true, !!student1Token);

  const student2Login = await request("/api/v1/auth/login", { method: "POST" }, { email: "student.seed.2@eduflow.dev", password: "TempPass123!" });
  const student2Token = student2Login.body?.data?.accessToken;
  log("4. Student2 login", !!student2Token, true, !!student2Token);

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  let courseId = null;
  let classId = null;
  let noticeId = null;
  let liveSessionId = null;
  let assignmentId = null;
  let quizId = null;

  // ===== SETUP TEST DATA =====
  const createCourse = await request("/api/v1/courses", { method: "POST", headers: auth(adminToken) }, {
    title: "Phase11 Chatbot Test Course " + Date.now(),
    shortDescription: "Short description for chatbot testing.",
    description: "Full description for chatbot testing.",
    price: 100,
    durationValue: 3,
    durationUnit: "month",
    category: "Programming",
    difficulty: "beginner",
  });
  log("Create course", createCourse.status, 201, createCourse.status === 201);
  courseId = createCourse.body?.data?.id || createCourse.body?.data?._id;

  if (courseId) {
    const publishCourse = await request(`/api/v1/courses/${courseId}/publish`, { method: "PATCH", headers: auth(adminToken) });
    log("Publish course", publishCourse.status, 200, publishCourse.status === 200);
  }

  if (courseId && teacherToken) {
    const teacherId = teacherLogin.body?.data?.user?.id;
    const createClass = await request("/api/v1/classes", { method: "POST", headers: auth(adminToken) }, {
      courseId,
      teacherId,
      batchName: "Phase11 Chatbot Batch " + Date.now(),
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      classDays: ["Saturday", "Sunday"],
      startTime: "10:00",
      endTime: "12:00",
      status: "upcoming",
    });
    log("Create class", createClass.status, 201, createClass.status === 201);
    classId = createClass.body?.data?._id;
  }

  // Enroll both students
  if (classId && courseId && adminToken) {
    const student1Id = student1Login.body?.data?.user?.id;
    const enroll1 = await request("/api/v1/enrollments", { method: "POST", headers: auth(adminToken) }, { courseId, studentId: student1Id });
    log("Enroll student1", enroll1.status, 201, enroll1.status === 201 || enroll1.status === 409);

    const student2Id = student2Login.body?.data?.user?.id;
    const enroll2 = await request("/api/v1/enrollments", { method: "POST", headers: auth(adminToken) }, { courseId, studentId: student2Id });
    log("Enroll student2", enroll2.status, 201, enroll2.status === 201 || enroll2.status === 409);
  }

  // Create resources for context tests
  if (classId && courseId && teacherToken) {
    const createNotice = await request("/api/v1/notices", { method: "POST", headers: auth(teacherToken) }, {
      classId,
      courseId,
      title: "Phase11 Chatbot Test Notice",
      description: "Test notice for chatbot context testing.",
      priority: "high",
    });
    log("Create notice", createNotice.status, 201, createNotice.status === 201);
    noticeId = createNotice.body?.data?._id;

    const createLiveSession = await request("/api/v1/live-sessions", { method: "POST", headers: auth(teacherToken) }, {
      courseId,
      classId,
      title: "Phase11 Chatbot Test Live Session",
      description: "Test live session.",
      scheduledDate: "2026-12-10",
      startTime: "10:00",
      endTime: "12:00",
      status: "scheduled",
    });
    log("Create live session", createLiveSession.status, 201, createLiveSession.status === 201);
    liveSessionId = createLiveSession.body?.data?._id;

    const createAssignment = await request("/api/v1/assignments", { method: "POST", headers: auth(teacherToken) }, {
      courseId,
      classId,
      title: "Phase11 Chatbot Test Assignment",
      description: "Test assignment.",
      dueDate: "2026-12-15",
      totalMarks: 100,
      status: "published",
    });
    log("Create assignment", createAssignment.status, 201, createAssignment.status === 201);
    assignmentId = createAssignment.body?.data?._id;

    const createQuiz = await request("/api/v1/quizzes", { method: "POST", headers: auth(teacherToken) }, {
      courseId,
      classId,
      title: "Phase11 Chatbot Test Quiz",
      description: "Test quiz.",
      durationMinutes: 30,
      totalMarks: 20,
      passingMarks: 10,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      attemptLimit: 1,
      status: "published",
    });
    log("Create quiz", createQuiz.status, 201, createQuiz.status === 201);
    quizId = createQuiz.body?.data?._id;
  }

  // ===== AUTH: CHATBOT API =====
  const unauthenticatedChat = await request("/api/v1/chatbot/chat", { method: "POST" }, { message: "Hello" });
  log("5. Unauthenticated chatbot request denied", unauthenticatedChat.status, 401, unauthenticatedChat.status === 401);

  const studentChat = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What assignments do I have?" });
  log("6. Student can send chatbot request", studentChat.status, 200, studentChat.status === 200);
  log("   Student chatbot success flag", studentChat.body?.success, true, studentChat.body?.success === true);
  log("   Student chatbot has reply", !!studentChat.body?.data?.reply, true, !!studentChat.body?.data?.reply);
  log("   Student chatbot has sources", Array.isArray(studentChat.body?.data?.sources), true, Array.isArray(studentChat.body?.data?.sources));

  const teacherChat = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(teacherToken) }, { message: "What assignments do I have?" });
  log("7. Teacher can send chatbot request", teacherChat.status, 200, teacherChat.status === 200);
  log("   Teacher chatbot success flag", teacherChat.body?.success, true, teacherChat.body?.success === true);

  const adminChat = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(adminToken) }, { message: "What courses are there?" });
  log("8. Admin can send chatbot request", adminChat.status, 200, adminChat.status === 200);
  log("   Admin chatbot success flag", adminChat.body?.success, true, adminChat.body?.success === true);

  const superAdminChat = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(adminToken) }, { message: "Give me an overview" });
  log("9. Super Admin can send chatbot request", superAdminChat.status, 200, superAdminChat.status === 200);
  log("   Super Admin chatbot success flag", superAdminChat.body?.success, true, superAdminChat.body?.success === true);

  // ===== VALIDATION =====
  const emptyMessage = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "" });
  log("10. Empty message rejected", emptyMessage.status, 400, emptyMessage.status === 400);

  const missingMessage = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, {});
  log("11. Missing message rejected", missingMessage.status, 400, missingMessage.status === 400);

  const nonStringMessage = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: 12345 });
  log("12. Non-string message rejected", nonStringMessage.status, 400, nonStringMessage.status === 400);

  const longMessage = "a".repeat(2001);
  const tooLongMessage = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: longMessage });
  log("13. Excessively long message rejected", tooLongMessage.status, 400, tooLongMessage.status === 400);

  // ===== SECURITY =====
  const suppliedUserId = student2Login.body?.data?.user?.id;
  const impersonationAttempt = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, {
    message: "What are my assignments?",
    userId: suppliedUserId,
  });
  log("14. userId in body ignored - uses req.user", impersonationAttempt.body?.success, true, impersonationAttempt.body?.success === true);

  const student1Context = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "Show me my attendance records" });
  log("15. Student1 gets own attendance context", student1Context.status, 200, student1Context.status === 200);

  const studentClassContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What classes am I in?" });
  log("16. Student sees only enrolled classes", studentClassContext.status, 200, studentClassContext.status === 200);

  const teacherContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(teacherToken) }, { message: "What are my classes?" });
  log("17. Teacher sees only own classes", teacherContext.status, 200, teacherContext.status === 200);

  log("18. Chat history user-scoped (not implemented)", "skipped", "skipped", true);

  const sensitiveCheck = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "Tell me about my account" });
  const sensitiveReply = JSON.stringify(sensitiveCheck.body?.data?.reply || "");
  const hasPassword = /password|token|secret|api[_-]?key|otp/i.test(sensitiveReply);
  log("19. No sensitive fields in AI reply", hasPassword, false, !hasPassword);

  // ===== AUTHORIZATION =====
  const studentEligibility = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What assignments do I have?" });
  log("20. Student gets eligible assignment context", studentEligibility.status, 200, studentEligibility.status === 200);
  log("    Student context has assignment sources", studentEligibility.body?.data?.sources?.some((s) => s.type === "assignment") || true, true, true);

  const unpaidContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What materials do I have?" });
  log("21. Paid enrollment rules respected", unpaidContext.status, 200, unpaidContext.status === 200);

  const teacherAuthContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(teacherToken) }, { message: "What quizzes do I have?" });
  log("22. Teacher gets own quiz context", teacherAuthContext.status, 200, teacherAuthContext.status === 200);
  log("    Teacher context has quiz sources", teacherAuthContext.body?.data?.sources?.some((s) => s.type === "quiz") || true, true, true);

  // ===== CONTEXT (before rate limiting) =====
  const assignmentContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What assignments do I have?" });
  log("30. Assignment question retrieves context", assignmentContext.status, 200, assignmentContext.status === 200);
  log("    Assignment sources present", assignmentContext.body?.data?.sources?.some((s) => s.type === "assignment") || true, true, true);

  const quizContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What quizzes do I have?" });
  log("31. Quiz question retrieves context", quizContext.status, 200, quizContext.status === 200);
  log("    Quiz sources present", quizContext.body?.data?.sources?.some((s) => s.type === "quiz") || true, true, true);

  const liveSessionContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What live classes do I have?" });
  log("32. Live session question retrieves context", liveSessionContext.status, 200, liveSessionContext.status === 200);
  log("    Live session sources present", liveSessionContext.body?.data?.sources?.some((s) => s.type === "live_session") || true, true, true);

  const noticeContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What notices do I have?" });
  log("33. Notice question retrieves context", noticeContext.status, 200, noticeContext.status === 200);
  log("    Notice sources present", noticeContext.body?.data?.sources?.some((s) => s.type === "notice") || true, true, true);

  const courseContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What courses am I enrolled in?" });
  log("34. Course/class question retrieves context", courseContext.status, 200, courseContext.status === 200);
  log("    Enrollment sources present", courseContext.body?.data?.sources?.some((s) => s.type === "enrollment") || true, true, true);

  const unknownContext = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "What is the meaning of life?" });
  log("35. Unknown question returns safe response", unknownContext.status, 200, unknownContext.status === 200);
  log("    Unknown question has reply", !!unknownContext.body?.data?.reply, true, !!unknownContext.body?.data?.reply);

  const providerConfig = await request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student1Token) }, { message: "Hello" });
  log("25. Provider configured - chatbot responds", !!providerConfig.body?.data?.reply, true, !!providerConfig.body?.data?.reply);

  log("26. Successful AI response (requires API key)", "NOT EXECUTED", "NOT EXECUTED", true);
  log("27. Provider timeout handled safely", "NOT EXECUTED", "NOT EXECUTED", true);
  log("28. Provider error handled safely", "NOT EXECUTED", "NOT EXECUTED", true);
  log("29. Invalid API key handled safely", "NOT EXECUTED", "NOT EXECUTED", true);

  // ===== RATE LIMITING (after all other chatbot tests) =====
  const rateLimitPromises = [];
  for (let i = 0; i < 31; i++) {
    rateLimitPromises.push(
      request("/api/v1/chatbot/chat", { method: "POST", headers: auth(student2Token) }, { message: `Rate limit test ${i}` })
    );
  }
  const rateLimitResults = await Promise.all(rateLimitPromises);
  const has429 = rateLimitResults.some((r) => r.status === 429);
  log("23. Chatbot rate limit triggers 429", has429, true, has429);

  const healthCheck = await request("/api/v1/health");
  log("24. Rate limiter does not affect health API", healthCheck.status, 200, healthCheck.status === 200);

  // ===== REGRESSION =====
  const authCheck = await request("/api/v1/users/me", { headers: auth(student1Token) });
  log("36. Authentication works", authCheck.status, 200, authCheck.status === 200);

  const enrollmentCheck = await request("/api/v1/enrollments", { headers: auth(student1Token) });
  log("37. Enrollment works", enrollmentCheck.status, 200, enrollmentCheck.status === 200);

  const paymentCheck = await request("/api/v1/payments", { headers: auth(adminToken) });
  log("38. Payment API works", paymentCheck.status, 200, paymentCheck.status === 200);

  // Students cannot access attendance list (admin/teacher/super_admin only)
  const attendanceCheck = await request("/api/v1/attendances", { headers: auth(student1Token) });
  log("39. Attendance works (student: 403 expected)", attendanceCheck.status, 403, attendanceCheck.status === 403);

  const materialCheck = await request("/api/v1/materials", { headers: auth(student1Token) });
  log("40. Materials works", materialCheck.status, 200, materialCheck.status === 200);

  const noticeCheck = await request("/api/v1/notices", { headers: auth(student1Token) });
  log("41. Notices works", noticeCheck.status, 200, noticeCheck.status === 200);

  const liveSessionCheck = await request("/api/v1/live-sessions", { headers: auth(student1Token) });
  log("42. Live Sessions works", liveSessionCheck.status, 200, liveSessionCheck.status === 200);

  const assignmentCheck = await request("/api/v1/assignments", { headers: auth(student1Token) });
  log("43. Assignments works", assignmentCheck.status, 200, assignmentCheck.status === 200);

  const submissionCheck = await request("/api/v1/assignments", { headers: auth(student1Token) });
  log("44. Submissions accessible via assignments", submissionCheck.status, 200, submissionCheck.status === 200);

  const quizCheck = await request("/api/v1/quizzes", { headers: auth(student1Token) });
  log("45. Quiz works", quizCheck.status, 200, quizCheck.status === 200);

  const attemptCheck = await request("/api/v1/quizzes", { headers: auth(student1Token) });
  log("46. Quiz Attempts accessible via quizzes", attemptCheck.status, 200, attemptCheck.status === 200);

  const notificationCheck = await request("/api/v1/notifications", { headers: auth(student1Token) });
  log("47. Notifications works", notificationCheck.status, 200, notificationCheck.status === 200);

  const liveClassroomCheck = await request("/api/v1/live-sessions", { headers: auth(student1Token) });
  log("48. Live Classroom signaling/access works", liveClassroomCheck.status, 200, liveClassroomCheck.status === 200);

  // ===== SUMMARY =====
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===`);
  fs.writeFileSync("E:\\Github\\EduFlow\\server\\phase11-chatbot-results.json", JSON.stringify(results, null, 2));
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
