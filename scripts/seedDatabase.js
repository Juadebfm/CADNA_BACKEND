import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../models/userModel.js";
import Exam from "../models/examModel.js";
import ExamSession from "../models/examSessionModel.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "cadna-backend-new",
    });
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Exam.deleteMany({});
    await ExamSession.deleteMany({});
    console.log("Cleared existing data");

    // Create admin user
    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@cadna.com",
      phone: "+1234567890",
      password: "admin123",
      role: "admin",
      university: "CADNA University",
    });

    // Create instructor
    const instructor = await User.create({
      firstName: "John",
      lastName: "Instructor",
      email: "instructor@cadna.com",
      phone: "+1234567891",
      password: "instructor123",
      role: "instructor",
      university: "CADNA University",
    });

    // Create students
    const students = await User.create([
      {
        firstName: "Alice",
        lastName: "Student",
        email: "alice@student.com",
        phone: "+1234567892",
        password: "student123",
        role: "student",
        university: "CADNA University",
        studentId: "STU001",
      },
      {
        firstName: "Bob",
        lastName: "Student",
        email: "bob@student.com",
        phone: "+1234567893",
        password: "student123",
        role: "student",
        university: "CADNA University",
        studentId: "STU002",
      },
      // 10 test students for load testing
      {
        firstName: "Test",
        lastName: "Student1",
        email: "teststudent1@test.com",
        phone: "08000000001",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student2",
        email: "teststudent2@test.com",
        phone: "08000000002",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student3",
        email: "teststudent3@test.com",
        phone: "08000000003",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student4",
        email: "teststudent4@test.com",
        phone: "08000000004",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student5",
        email: "teststudent5@test.com",
        phone: "08000000005",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student6",
        email: "teststudent6@test.com",
        phone: "08000000006",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student7",
        email: "teststudent7@test.com",
        phone: "08000000007",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student8",
        email: "teststudent8@test.com",
        phone: "08000000008",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student9",
        email: "teststudent9@test.com",
        phone: "08000000009",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
      {
        firstName: "Test",
        lastName: "Student10",
        email: "teststudent10@test.com",
        phone: "08000000010",
        password: "Test1234!",
        role: "student",
        university: "CADNA University",
      },
    ]);

    console.log(`Created ${students.length} students`);

    // Get all student IDs to enroll in exams
    const allStudentIds = students.map((s) => s._id);

    // Create sample exam
    const examLink = crypto.randomUUID();
    const accessCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const sampleExam = await Exam.create({
      title: "Introduction to Computer Science",
      description:
        "A mixed-format exam testing foundational knowledge in computing, programming, networks, and cybersecurity.",
      instructor: instructor._id,
      examLink: examLink,
      accessCode: accessCode,
      questions: [
        {
          _id: new mongoose.Types.ObjectId(),
          type: "multiple-choice",
          question:
            "Which device is responsible for processing instructions in a computer?",
          options: [
            { text: "RAM", isCorrect: false },
            { text: "CPU", isCorrect: true },
            { text: "GPU", isCorrect: false },
            { text: "ROM", isCorrect: false },
          ],
          points: 2,
          difficulty: "easy",
          category: "Hardware",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "multiple-choice",
          question:
            "Which of the following is the correct file extension for a JavaScript file?",
          options: [
            { text: ".js", isCorrect: true },
            { text: ".jsx", isCorrect: false },
            { text: ".jv", isCorrect: false },
            { text: ".script", isCorrect: false },
          ],
          points: 2,
          difficulty: "easy",
          category: "Programming",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "true-false",
          question: "HTTP is a secure communication protocol.",
          options: [
            { text: "True", isCorrect: false },
            { text: "False", isCorrect: true },
          ],
          points: 1,
          difficulty: "medium",
          category: "Networking",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "short-answer",
          question: "What does RAM stand for?",
          correctAnswer: "Random Access Memory",
          points: 2,
          difficulty: "easy",
          category: "Hardware",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "multiple-choice",
          question: "Which of these is NOT a cybersecurity threat?",
          options: [
            { text: "Phishing", isCorrect: false },
            { text: "Malware", isCorrect: false },
            { text: "DDoS", isCorrect: false },
            { text: "Compiler", isCorrect: true },
          ],
          points: 2,
          difficulty: "medium",
          category: "Cybersecurity",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "multiple-choice",
          question: "Which HTML tag is used to link a JavaScript file?",
          options: [
            { text: "<javascript>", isCorrect: false },
            { text: "<script>", isCorrect: true },
            { text: "<link>", isCorrect: false },
            { text: "<js>", isCorrect: false },
          ],
          points: 2,
          difficulty: "easy",
          category: "Web Development",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "short-answer",
          question: "Name one advantage of cloud computing.",
          correctAnswer: "Scalability",
          points: 2,
          difficulty: "medium",
          category: "Cloud",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "true-false",
          question: "A router is used to connect multiple networks together.",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          points: 1,
          difficulty: "easy",
          category: "Networking",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "essay",
          question:
            "Explain the difference between software and hardware. Provide at least two examples for each.",
          points: 5,
          difficulty: "medium",
          category: "Computing",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "code",
          question:
            "Write a JavaScript function named `addNumbers` that takes two parameters and returns their sum.",
          points: 5,
          difficulty: "hard",
          category: "Programming",
        },
      ],
      settings: {
        timeLimit: 50,
        passingScore: 65,
        randomizeQuestions: true,
        randomizeOptions: true,
        allowReview: true,
        showResults: true,
        antiCheating: true,
        autoGrading: true,
      },
      schedule: {
        startDate: new Date("2026-03-15T00:00:00Z"),
        endDate: new Date("2026-12-01T00:00:00Z"),
        timezone: "Africa/Lagos",
      },
      enrolledStudents: allStudentIds,
      isActive: true,
      category: "Computing",
      tags: ["computers", "technology", "programming", "IT"],
    });

    console.log("Created sample exam");

    // Create second exam with all parameters
    const examLink2 = crypto.randomUUID();
    const accessCode2 = crypto.randomBytes(4).toString("hex").toUpperCase();

    const advancedExam = await Exam.create({
      title: "Advanced Web Development & Security",
      description:
        "Comprehensive exam covering advanced web technologies, security practices, and modern development frameworks.",
      instructor: instructor._id,
      examLink: examLink2,
      accessCode: accessCode2,
      questions: [
        {
          _id: new mongoose.Types.ObjectId(),
          type: "multiple-choice",
          question: "Which HTTP status code indicates a successful request?",
          options: [
            { text: "200", isCorrect: true },
            { text: "404", isCorrect: false },
            { text: "500", isCorrect: false },
            { text: "302", isCorrect: false },
          ],
          points: 3,
          difficulty: "easy",
          category: "Web Development",
          media: "https://example.com/http-codes.png",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "true-false",
          question: "HTTPS encrypts data in transit between client and server.",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          points: 2,
          difficulty: "easy",
          category: "Security",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "short-answer",
          question: "What does API stand for?",
          correctAnswer: "Application Programming Interface",
          points: 2,
          difficulty: "easy",
          category: "Web Development",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "multiple-choice",
          question: "Which of the following is a NoSQL database?",
          options: [
            { text: "MySQL", isCorrect: false },
            { text: "PostgreSQL", isCorrect: false },
            { text: "MongoDB", isCorrect: true },
            { text: "SQLite", isCorrect: false },
          ],
          points: 3,
          difficulty: "medium",
          category: "Database",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "essay",
          question:
            "Explain the concept of Cross-Site Scripting (XSS) attacks and describe three methods to prevent them.",
          points: 10,
          difficulty: "hard",
          category: "Security",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          type: "code",
          question:
            "Write a JavaScript function that validates an email address using regex.",
          points: 8,
          difficulty: "hard",
          category: "Programming",
        },
      ],
      settings: {
        timeLimit: 90,
        passingScore: 75,
        randomizeQuestions: false,
        randomizeOptions: true,
        allowReview: false,
        showResults: false,
        antiCheating: true,
        autoGrading: false,
      },
      schedule: {
        startDate: new Date("2026-03-15T09:00:00Z"),
        endDate: new Date("2026-12-15T18:00:00Z"),
        timezone: "Africa/Lagos",
      },
      enrolledStudents: allStudentIds,
      isActive: true,
      category: "Advanced Technology",
      tags: [
        "web-development",
        "security",
        "advanced",
        "programming",
        "database",
      ],
    });

    console.log("Created advanced exam");

    console.log("\n=== DATABASE SEEDED SUCCESSFULLY! ===");
    console.log("\n📚 SAMPLE EXAMS CREATED:");
    console.log(`\n1. ${sampleExam.title}`);
    console.log(`   ID: ${sampleExam._id}`);
    console.log(`   Access Code: ${sampleExam.accessCode}`);
    console.log(
      `   Link: ${process.env.FRONTEND_URL || "http://localhost:5173"}/exam/${sampleExam.examLink}`
    );
    console.log(`\n2. ${advancedExam.title}`);
    console.log(`   ID: ${advancedExam._id}`);
    console.log(`   Access Code: ${advancedExam.accessCode}`);
    console.log(
      `   Link: ${process.env.FRONTEND_URL || "http://localhost:5173"}/exam/${advancedExam.examLink}`
    );
    console.log(`\n👥 SAMPLE CREDENTIALS:`);
    console.log("Admin: admin@cadna.com / admin123");
    console.log("Instructor: instructor@cadna.com / instructor123");
    console.log("Student 1: alice@student.com / student123");
    console.log("Student 2: bob@student.com / student123");
    console.log("Load Test Students: teststudent1-10@test.com / Test1234!");
    console.log("\n📋 INSTRUCTIONS:");
    console.log("1. Login as a student");
    console.log("2. All students are auto-enrolled in both exams");
    console.log("3. Click Take Exam to start!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedDatabase();
