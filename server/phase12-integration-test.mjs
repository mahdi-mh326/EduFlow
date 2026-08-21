import http from "http";
import { writeFileSync } from "fs";

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

function getValue(obj, path, defaultValue = null) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : defaultValue), obj);
}

async function run() {
  console.log("=== PHASE 12: BACKEND INTEGRATION + FINAL TESTING ===\n");

  // ===== SERVER HEALTH =====
  const health = await request("/api/v1/health");
  const serverAvailable = health.status === 200;
  log("Server health check", health.status, 200, serverAvailable);

  if (!serverAvailable) {
    console.error("\nFATAL: Server is not running. Start with: npm run dev");
    process.exit(1);
  }

  // ===== AUTH SETUP =====
  console.log("\n--- AUTH ---");

  const adminLogin = await request("/api/v1/auth/login", { method: "POST" }, { email: "admin@eduflow.com", password: "Admin@12345" });
  const adminToken = getValue(adminLogin.body, "data.accessToken");
  log("Admin login", !!adminToken, true, !!adminToken);

  const teacherALogin = await request("/api/v1/auth/login", { method: "POST" }, { email: "teacher.phase4.a@eduflow.dev", password: "Phase4TeacherA@123" });
  const teacherAToken = getValue(teacherALogin.body, "data.accessToken");
  const teacherAId = getValue(teacherALogin.body, "data.user.id");
  log("Teacher A login", !!teacherAToken, true, !!teacherAToken);

  const teacherBLogin = await request("/api/v1/auth/login", { method: "POST" }, { email: "teacher.phase4.b@eduflow.dev", password: "Phase4TeacherB@123" });
  const teacherBToken = getValue(teacherBLogin.body, "data.accessToken");
  const teacherBId = getValue(teacherBLogin.body, "data.user.id");
  log("Teacher B login", !!teacherBToken, true, !!teacherBToken);

  const student1Login = await request("/api/v1/auth/login", { method: "POST" }, { email: "student.seed.1@eduflow.dev", password: "TempPass123!" });
  const student1Token = getValue(student1Login.body, "data.accessToken");
  const student1Id = getValue(student1Login.body, "data.user.id");
  log("Student1 login", !!student1Token, true, !!student1Token);

  const student2Login = await request("/api/v1/auth/login", { method: "POST" }, { email: "student.seed.2@eduflow.dev", password: "TempPass123!" });
  const student2Token = getValue(student2Login.body, "data.accessToken");
  const student2Id = getValue(student2Login.body, "data.user.id");
  log("Student2 login", !!student2Token, true, !!student2Token);

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  // ===== COURSE SETUP =====
  console.log("\n--- COURSE / CLASS / ENROLLMENT ---");

  let courseId = null;
  let classAId = null;
  let classBId = null;
  let student1EnrollmentId = null;
  let student2EnrollmentId = null;
  let paymentId = null;
  let materialId = null;
  let noticeId = null;
  let liveSessionId = null;
  let assignmentId = null;
  let quizId = null;
  let questionId = null;
  let attemptId = null;
  let submissionId = null;
  let notificationId = null;

  // Create course
  const createCourse = await request("/api/v1/courses", { method: "POST", headers: auth(adminToken) }, {
    title: "Phase12 Integration Test Course " + Date.now(),
    shortDescription: "Integration test course.",
    description: "Full description for Phase 12 integration testing.",
    price: 100,
    durationValue: 3,
    durationUnit: "month",
    category: "Programming",
    difficulty: "beginner",
  });
  log("Create course", createCourse.status, 201, createCourse.status === 201);
  courseId = getValue(createCourse.body, "data.id") || getValue(createCourse.body, "data._id");

  if (courseId) {
    const publishCourse = await request(`/api/v1/courses/${courseId}/publish`, { method: "PATCH", headers: auth(adminToken) });
    log("Publish course", publishCourse.status, 200, publishCourse.status === 200);
  }

  // Create Class A (Teacher A)
  if (courseId && teacherAId) {
    const createClassA = await request("/api/v1/classes", { method: "POST", headers: auth(adminToken) }, {
      courseId,
      teacherId: teacherAId,
      batchName: "Phase12 Batch A " + Date.now(),
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      classDays: ["Saturday", "Sunday"],
      startTime: "10:00",
      endTime: "12:00",
      status: "upcoming",
    });
    log("Create class A", createClassA.status, 201, createClassA.status === 201);
    classAId = getValue(createClassA.body, "data._id");
  }

  // Create Class B (Teacher B)
  if (courseId && teacherBId) {
    const createClassB = await request("/api/v1/classes", { method: "POST", headers: auth(adminToken) }, {
      courseId,
      teacherId: teacherBId,
      batchName: "Phase12 Batch B " + Date.now(),
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      classDays: ["Saturday", "Sunday"],
      startTime: "10:00",
      endTime: "12:00",
      status: "upcoming",
    });
    log("Create class B", createClassB.status, 201, createClassB.status === 201);
    classBId = getValue(createClassB.body, "data._id");
  }

  // Enroll Student1 in Class A (Admin creates enrollment, initial paymentStatus=PENDING)
  if (classAId && courseId && adminToken && student1Id) {
    const enrollStudent1 = await request("/api/v1/enrollments", { method: "POST", headers: auth(adminToken) }, {
      courseId,
      studentId: student1Id,
      paymentStatus: "pending",
    });
    log("Enroll Student1 in Class A", enrollStudent1.status, 201, enrollStudent1.status === 201 || enrollStudent1.status === 409);
    student1EnrollmentId = getValue(enrollStudent1.body, "data._id");
  }

  // Enroll Student2 in Class A (Admin creates enrollment)
  if (classAId && courseId && adminToken && student2Id) {
    const enrollStudent2 = await request("/api/v1/enrollments", { method: "POST", headers: auth(adminToken) }, {
      courseId,
      studentId: student2Id,
      paymentStatus: "pending",
    });
    log("Enroll Student2 in Class A", enrollStudent2.status, 201, enrollStudent2.status === 201 || enrollStudent2.status === 409);
    student2EnrollmentId = getValue(enrollStudent2.body, "data._id");
  }

  // ===== PAYMENT FLOW =====
  console.log("\n--- PAYMENT ---");

  // Student1 initiates payment
  let initiatePaymentResult = null;
  if (classAId && courseId && student1Token) {
    initiatePaymentResult = await request("/api/v1/payments/initiate", { method: "POST", headers: auth(student1Token) }, {
      courseId,
      classId: classAId,
    });
    log("Student1 initiate payment", initiatePaymentResult.status, 200, initiatePaymentResult.status === 200);
    paymentId = getValue(initiatePaymentResult.body, "data.paymentId");
  }

  // Re-initiate payment for pending payment - updates transactionId (by design)
  if (classAId && courseId && student1Token) {
    const duplicatePayment = await request("/api/v1/payments/initiate", { method: "POST", headers: auth(student1Token) }, {
      courseId,
      classId: classAId,
    });
    log("Re-initiate payment for pending (updates tranId)", duplicatePayment.status, 200, duplicatePayment.status === 200);
  }

  // Student2 initiates payment
  let student2PaymentId = null;
  if (classAId && courseId && student2Token) {
    const student2Payment = await request("/api/v1/payments/initiate", { method: "POST", headers: auth(student2Token) }, {
      courseId,
      classId: classAId,
    });
    log("Student2 initiate payment", student2Payment.status, 200, student2Payment.status === 200);
    student2PaymentId = getValue(student2Payment.body, "data.paymentId");
  }

  // ===== MATERIAL =====
  console.log("\n--- MATERIAL ---");

  if (classAId && courseId && teacherAToken) {
    const createMaterial = await request("/api/v1/materials", { method: "POST", headers: auth(teacherAToken) }, {
      courseId,
      classId: classAId,
      teacherId: teacherAId,
      title: "Phase12 Test Material",
      description: "Test material for integration.",
      fileUrl: "https://example.com/material.pdf",
      fileType: "pdf",
      visibility: "public",
    });
    log("Teacher A create material", createMaterial.status, 201, createMaterial.status === 201);
    materialId = getValue(createMaterial.body, "data._id");
  }

  // ===== NOTICE =====
  console.log("\n--- NOTICE ---");

  if (classAId && courseId && teacherAToken) {
    const createNotice = await request("/api/v1/notices", { method: "POST", headers: auth(teacherAToken) }, {
      classId: classAId,
      courseId,
      title: "Phase12 Test Notice",
      description: "Test notice for integration.",
      priority: "high",
    });
    log("Teacher A create notice", createNotice.status, 201, createNotice.status === 201);
    noticeId = getValue(createNotice.body, "data._id");
  }

  // ===== LIVE SESSION =====
  console.log("\n--- LIVE SESSION ---");

  if (classAId && courseId && teacherAToken) {
    const createLiveSession = await request("/api/v1/live-sessions", { method: "POST", headers: auth(teacherAToken) }, {
      courseId,
      classId: classAId,
      title: "Phase12 Test Live Session",
      description: "Test live session.",
      scheduledDate: "2026-12-10",
      startTime: "10:00",
      endTime: "12:00",
      status: "scheduled",
    });
    log("Teacher A create live session", createLiveSession.status, 201, createLiveSession.status === 201);
    liveSessionId = getValue(createLiveSession.body, "data._id");
  }

  // ===== ASSIGNMENT =====
  console.log("\n--- ASSIGNMENT ---");

  if (classAId && courseId && teacherAToken) {
    const createAssignment = await request("/api/v1/assignments", { method: "POST", headers: auth(teacherAToken) }, {
      courseId,
      classId: classAId,
      title: "Phase12 Test Assignment",
      description: "Test assignment.",
      dueDate: "2026-12-15",
      totalMarks: 100,
      status: "published",
    });
    log("Teacher A create assignment", createAssignment.status, 201, createAssignment.status === 201);
    assignmentId = getValue(createAssignment.body, "data._id");
  }

  // ===== QUIZ =====
  console.log("\n--- QUIZ ---");

  if (classAId && courseId && teacherAToken) {
    const createQuiz = await request("/api/v1/quizzes", { method: "POST", headers: auth(teacherAToken) }, {
      courseId,
      classId: classAId,
      title: "Phase12 Test Quiz",
      description: "Test quiz.",
      durationMinutes: 30,
      totalMarks: 20,
      passingMarks: 10,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      attemptLimit: 1,
      status: "published",
    });
    log("Teacher A create quiz", createQuiz.status, 201, createQuiz.status === 201);
    quizId = getValue(createQuiz.body, "data._id");
  }

  // Create question for quiz
  if (quizId && teacherAToken) {
    const createQuestion = await request(`/api/v1/quizzes/${quizId}/questions`, { method: "POST", headers: auth(teacherAToken) }, {
      questionText: "What is 2+2?",
      type: "mcq",
      options: [
        { key: "A", text: "3" },
        { key: "B", text: "4" },
        { key: "C", text: "5" },
      ],
      correctAnswer: "B",
      marks: 10,
      order: 1,
    });
    log("Teacher A create question", createQuestion.status, 201, createQuestion.status === 201);
    questionId = getValue(createQuestion.body, "data._id");
  }

  // ===== AUTHORIZATION / ACCESS CONTROL =====
  console.log("\n--- AUTHORIZATION ---");

  // Students with pending payment should be denied from paid resources
  if (assignmentId && student1Token) {
    const studentAssignment = await request(`/api/v1/assignments/${assignmentId}`, { headers: auth(student1Token) });
    log("Pending student denied assignment access", studentAssignment.status, 403, studentAssignment.status === 403);
  }

  if (quizId && student1Token) {
    const studentQuiz = await request(`/api/v1/quizzes/${quizId}`, { headers: auth(student1Token) });
    log("Pending student denied quiz access", studentQuiz.status, 403, studentQuiz.status === 403);
  }

  if (liveSessionId && student1Token) {
    const studentLiveSession = await request(`/api/v1/live-sessions/${liveSessionId}`, { headers: auth(student1Token) });
    log("Pending student denied live session access", studentLiveSession.status, 403, studentLiveSession.status === 403);
  }

  if (materialId && student1Token) {
    const studentMaterial = await request(`/api/v1/materials/${materialId}`, { headers: auth(student1Token) });
    log("Pending student denied material access", studentMaterial.status, 403, studentMaterial.status === 403);
  }

  if (noticeId && student1Token) {
    const studentNotice = await request(`/api/v1/notices/${noticeId}`, { headers: auth(student1Token) });
    log("Pending student denied notice access", studentNotice.status, 403, studentNotice.status === 403);
  }

  // Student1 tries to access Student2's enrollment
  if (student2EnrollmentId && student1Token) {
    const crossUserEnrollment = await request(`/api/v1/enrollments/${student2EnrollmentId}`, { headers: auth(student1Token) });
    log("Student1 cannot access Student2 enrollment", crossUserEnrollment.status, 403, crossUserEnrollment.status === 403);
  }

  // Public class discovery - students CAN see published classes (course discovery)
  if (classBId && student1Token) {
    const studentClassB = await request(`/api/v1/classes/${classBId}`, { headers: auth(student1Token) });
    log("Student can see published class (discovery)", studentClassB.status, 200, studentClassB.status === 200);
  }

  // Teacher B can see published classes (discovery)
  if (classAId && teacherBToken) {
    const teacherBClassA = await request(`/api/v1/classes/${classAId}`, { headers: auth(teacherBToken) });
    log("Teacher can see published class (discovery)", teacherBClassA.status, 200, teacherBClassA.status === 200);
  }

  // Students CAN see published courses (discovery)
  if (courseId && student1Token) {
    const studentCourses = await request("/api/v1/courses", { headers: auth(student1Token) });
    log("Student can see published courses (discovery)", studentCourses.status, 200, studentCourses.status === 200);
  }

  // Teacher B cannot access Teacher A's assignment
  if (assignmentId && teacherBToken) {
    const teacherBAssignment = await request(`/api/v1/assignments/${assignmentId}`, { headers: auth(teacherBToken) });
    log("Teacher B cannot access Teacher A assignment", teacherBAssignment.status, 403, teacherBAssignment.status === 403);
  }

  // Teacher B cannot create material in Teacher A's class
  if (classAId && courseId && teacherBToken) {
    const teacherBMaterial = await request("/api/v1/materials", { method: "POST", headers: auth(teacherBToken) }, {
      courseId,
      classId: classAId,
      teacherId: teacherBId,
      title: "Unauthorized Material",
      description: "Should fail.",
      fileUrl: "https://example.com/unauthorized.pdf",
      fileType: "pdf",
    });
    log("Teacher B cannot create material in Teacher A class", teacherBMaterial.status, 403, teacherBMaterial.status === 403);
  }

  // Teacher B cannot create notice in Teacher A's class
  if (classAId && courseId && teacherBToken) {
    const teacherBNotice = await request("/api/v1/notices", { method: "POST", headers: auth(teacherBToken) }, {
      classId: classAId,
      courseId,
      title: "Unauthorized Notice",
      description: "Should fail.",
    });
    log("Teacher B cannot create notice in Teacher A class", teacherBNotice.status, 403, teacherBNotice.status === 403);
  }

  // ===== VALIDATION =====
  console.log("\n--- VALIDATION ---");

  const invalidEnrollment = await request("/api/v1/enrollments", { method: "POST", headers: auth(student1Token) }, {});
  log("Missing courseId enrollment", invalidEnrollment.status, 404, invalidEnrollment.status === 404);

  const invalidCourseId = await request(`/api/v1/courses/invalid-id`, { headers: auth(adminToken) });
  log("Invalid course ID", invalidCourseId.status, 404, invalidCourseId.status === 404);

  // ===== RATE LIMITING =====
  console.log("\n--- RATE LIMITING ---");

  const rateLimitPromises = [];
  for (let i = 0; i < 6; i++) {
    rateLimitPromises.push(
      request("/api/v1/auth/login", { method: "POST" }, { email: "admin@eduflow.com", password: "WrongPass" + i })
    );
  }
  const rateLimitResults = await Promise.all(rateLimitPromises);
  const has429 = rateLimitResults.some((r) => r.status === 429);
  log("Auth rate limit triggers 429", has429, true, has429);

  // ===== STUDENT SELF-ENROLLMENT =====
  console.log("\n--- STUDENT SELF-ENROLLMENT ---");

  // Create a second course for self-enrollment test
  const createCourse2 = await request("/api/v1/courses", { method: "POST", headers: auth(adminToken) }, {
    title: "Phase12 Self-Enroll Course " + Date.now(),
    shortDescription: "Self-enrollment test course.",
    description: "Full description for self-enrollment test.",
    price: 50,
    durationValue: 2,
    durationUnit: "month",
    category: "Programming",
    difficulty: "beginner",
  });
  log("Create course for self-enrollment", createCourse2.status, 201, createCourse2.status === 201);
  const course2Id = getValue(createCourse2.body, "data.id") || getValue(createCourse2.body, "data._id");

  if (course2Id) {
    const publishCourse2 = await request(`/api/v1/courses/${course2Id}/publish`, { method: "PATCH", headers: auth(adminToken) });
    log("Publish course 2", publishCourse2.status, 200, publishCourse2.status === 200);
  }

  let classCId = null;
  if (course2Id && teacherAId) {
    const createClassC = await request("/api/v1/classes", { method: "POST", headers: auth(adminToken) }, {
      courseId: course2Id,
      teacherId: teacherAId,
      batchName: "Phase12 Batch C " + Date.now(),
      startDate: "2027-01-01",
      endDate: "2027-01-31",
      classDays: ["Saturday", "Sunday"],
      startTime: "10:00",
      endTime: "12:00",
      status: "upcoming",
    });
    log("Create class C", createClassC.status, 201, createClassC.status === 201);
    classCId = getValue(createClassC.body, "data._id");
  }

  // Student2 self-enrolls
  if (classCId && course2Id && student2Token) {
    const selfEnroll = await request("/api/v1/enrollments", { method: "POST", headers: auth(student2Token) }, {
      courseId: course2Id,
    });
    log("Student2 self-enroll", selfEnroll.status, 201, selfEnroll.status === 201 || selfEnroll.status === 409);
  }

  // Student2 tries to enroll someone else - gets overridden to self, so 409 if already enrolled
  if (classCId && course2Id && student2Token && student1Id) {
    const otherEnroll = await request("/api/v1/enrollments", { method: "POST", headers: auth(student2Token) }, {
      courseId: course2Id,
      studentId: student1Id,
    });
    log("Student2 cannot enroll other student (409 self-override)", otherEnroll.status, 409, otherEnroll.status === 409);
  }

  // ===== TEACHER IDOR =====
  console.log("\n--- TEACHER IDOR ---");

  // Teacher B tries to create material in Teacher A's class
  if (classAId && courseId && teacherBToken) {
    const teacherBMaterial = await request("/api/v1/materials", { method: "POST", headers: auth(teacherBToken) }, {
      courseId,
      classId: classAId,
      teacherId: teacherBId,
      title: "Unauthorized Material",
      description: "Should fail.",
      fileUrl: "https://example.com/unauthorized.pdf",
      fileType: "pdf",
    });
    log("Teacher B cannot create material in Teacher A class", teacherBMaterial.status, 403, teacherBMaterial.status === 403);
  }

  // Teacher B tries to create notice in Teacher A's class
  if (classAId && courseId && teacherBToken) {
    const teacherBNotice = await request("/api/v1/notices", { method: "POST", headers: auth(teacherBToken) }, {
      classId: classAId,
      courseId,
      title: "Unauthorized Notice",
      description: "Should fail.",
    });
    log("Teacher B cannot create notice in Teacher A class", teacherBNotice.status, 403, teacherBNotice.status === 403);
  }

  // ===== PAYMENT CALLBACKS =====
  console.log("\n--- PAYMENT CALLBACKS ---");

  if (paymentId) {
    const invalidCallback = await request(`/api/v1/payments/success?tran_id=invalid&val_id=invalid`);
    log("Invalid payment callback returns 404", invalidCallback.status, 404, invalidCallback.status === 404);
  }

  // ===== SOFT DELETE =====
  console.log("\n--- SOFT DELETE ---");

  if (materialId && teacherAToken) {
    const deleteMaterial = await request(`/api/v1/materials/${materialId}`, { method: "DELETE", headers: auth(teacherAToken) });
    log("Teacher A soft delete material", deleteMaterial.status, 200, deleteMaterial.status === 200);
  }

  // ===== ENROLLMENT DELETE =====
  console.log("\n--- ENROLLMENT DELETE ---");

  if (student2EnrollmentId && adminToken) {
    const deleteEnrollment = await request(`/api/v1/enrollments/${student2EnrollmentId}`, { method: "DELETE", headers: auth(adminToken) });
    log("Admin soft delete enrollment", deleteEnrollment.status, 200, deleteEnrollment.status === 200);
  }

  // ===== QUIZ DRAFT VISIBILITY =====
  console.log("\n--- QUIZ DRAFT VISIBILITY ---");

  // Create draft quiz
  let draftQuizId = null;
  if (classAId && courseId && teacherAToken) {
    const createDraftQuiz = await request("/api/v1/quizzes", { method: "POST", headers: auth(teacherAToken) }, {
      courseId,
      classId: classAId,
      title: "Phase12 Draft Quiz",
      description: "Draft quiz.",
      durationMinutes: 30,
      totalMarks: 20,
      passingMarks: 10,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      attemptLimit: 1,
      status: "draft",
    });
    log("Teacher A create draft quiz", createDraftQuiz.status, 201, createDraftQuiz.status === 201);
    draftQuizId = getValue(createDraftQuiz.body, "data._id");
  }

  // Student should not see draft quiz
  if (draftQuizId && student1Token) {
    const studentDraftQuiz = await request(`/api/v1/quizzes/${draftQuizId}`, { headers: auth(student1Token) });
    log("Student cannot see draft quiz", studentDraftQuiz.status, 403, studentDraftQuiz.status === 403);
  }

  // ===== ASSIGNMENT DRAFT VISIBILITY =====
  console.log("\n--- ASSIGNMENT DRAFT VISIBILITY ---");

  // Create draft assignment
  let draftAssignmentId = null;
  if (classAId && courseId && teacherAToken) {
    const createDraftAssignment = await request("/api/v1/assignments", { method: "POST", headers: auth(teacherAToken) }, {
      courseId,
      classId: classAId,
      title: "Phase12 Draft Assignment",
      description: "Draft assignment.",
      dueDate: "2026-12-15",
      totalMarks: 100,
      status: "draft",
    });
    log("Teacher A create draft assignment", createDraftAssignment.status, 201, createDraftAssignment.status === 201);
    draftAssignmentId = getValue(createDraftAssignment.body, "data._id");
  }

  // Student should not see draft assignment
  if (draftAssignmentId && student1Token) {
    const studentDraftAssignment = await request(`/api/v1/assignments/${draftAssignmentId}`, { headers: auth(student1Token) });
    log("Student cannot see draft assignment", studentDraftAssignment.status, 403, studentDraftAssignment.status === 403);
  }

  // ===== PAYMENT ACCESS CONTROL =====
  console.log("\n--- PAYMENT ACCESS CONTROL ---");

  if (paymentId && student1Token) {
    const studentPayments = await request("/api/v1/payments/student/payments", { headers: auth(student1Token) });
    log("Student1 sees own payments", studentPayments.status, 200, studentPayments.status === 200);
  }

  // ===== NOTIFICATION IDOR =====
  console.log("\n--- NOTIFICATION IDOR ---");

  // Get Student1 notifications first
  if (student1Token) {
    const student1Notifications = await request("/api/v1/notifications", { headers: auth(student1Token) });
    const firstNotificationId = getValue(student1Notifications.body, "data.0._id");
    if (firstNotificationId && student2Token) {
      const crossNotification = await request(`/api/v1/notifications/${firstNotificationId}/read`, { method: "PATCH", headers: auth(student2Token) });
      log("Student2 cannot access Student1 notification", crossNotification.status, 404, crossNotification.status === 404);
    }
  }

  // ===== COURSE DELETION =====
  console.log("\n--- COURSE DELETION ---");

  if (courseId && adminToken) {
    const deleteCourse = await request(`/api/v1/courses/${courseId}`, { method: "DELETE", headers: auth(adminToken) });
    log("Admin soft delete course", deleteCourse.status, 200, deleteCourse.status === 200);
  }

  // ===== SUMMARY =====
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const notExecuted = results.filter((r) => r.expected === "NOT EXECUTED").length;

  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${results.length}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log(`NOT EXECUTED: ${notExecuted}`);

  if (failed > 0) {
    console.log("\n=== FAILURES ===");
    results.filter((r) => !r.pass).forEach((r) => {
      console.log(`- ${r.name}: expected ${r.expected}, got ${r.actual}`);
    });
  }

  writeFileSync("phase12-integration-results.json", JSON.stringify(results, null, 2));
  console.log("\nResults saved to phase12-integration-results.json");

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
