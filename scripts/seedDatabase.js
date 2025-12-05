import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import User from "../models/userModel.js";
import Exam from "../models/examModel.js";

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
    ]);

    console.log("Created users");

    // Create sample exam
    const examLink = crypto.randomUUID();
    const accessCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const sampleExam = await Exam.create({
      title: "Introduction to Computer Science",
      description: "A mixed-format exam testing foundational knowledge in computing, programming, networks, and cybersecurity.",
      instructor: instructor._id,
      examLink: examLink,
      accessCode: accessCode,
      questions: [
        {
          type: "multiple-choice",
          question: "Which device is responsible for processing instructions in a computer?",
          options: [
            { text: "RAM", isCorrect: false },
            { text: "CPU", isCorrect: true },
            { text: "GPU", isCorrect: false },
            { text: "ROM", isCorrect: false }
          ],
          points: 2,
          difficulty: "easy",
          category: "Hardware"
        },
        {
          type: "multiple-choice",
          question: "Which of the following is the correct file extension for a JavaScript file?",
          options: [
            { text: ".js", isCorrect: true },
            { text: ".jsx", isCorrect: false },
            { text: ".jv", isCorrect: false },
            { text: ".script", isCorrect: false }
          ],
          points: 2,
          difficulty: "easy",
          category: "Programming"
        },
        {
          type: "true-false",
          question: "HTTP is a secure communication protocol.",
          options: [
            { text: "True", isCorrect: false },
            { text: "False", isCorrect: true }
          ],
          points: 1,
          difficulty: "medium",
          category: "Networking"
        },
        {
          type: "short-answer",
          question: "What does RAM stand for?",
          correctAnswer: "Random Access Memory",
          points: 2,
          difficulty: "easy",
          category: "Hardware"
        },
        {
          type: "multiple-choice",
          question: "Which of these is NOT a cybersecurity threat?",
          options: [
            { text: "Phishing", isCorrect: false },
            { text: "Malware", isCorrect: false },
            { text: "DDoS", isCorrect: false },
            { text: "Compiler", isCorrect: true }
          ],
          points: 2,
          difficulty: "medium",
          category: "Cybersecurity"
        },
        {
          type: "multiple-choice",
          question: "Which HTML tag is used to link a JavaScript file?",
          options: [
            { text: "<javascript>", isCorrect: false },
            { text: "<script>", isCorrect: true },
            { text: "<link>", isCorrect: false },
            { text: "<js>", isCorrect: false }
          ],
          points: 2,
          difficulty: "easy",
          category: "Web Development"
        },
        {
          type: "short-answer",
          question: "Name one advantage of cloud computing.",
          correctAnswer: "Scalability",
          points: 2,
          difficulty: "medium",
          category: "Cloud"
        },
        {
          type: "true-false",
          question: "A router is used to connect multiple networks together.",
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false }
          ],
          points: 1,
          difficulty: "easy",
          category: "Networking"
        },
        {
          type: "essay",
          question: "Explain the difference between software and hardware. Provide at least two examples for each.",
          points: 5,
          difficulty: "medium",
          category: "Computing"
        },
        {
          type: "code",
          question: "Write a JavaScript function named `addNumbers` that takes two parameters and returns their sum.",
          points: 5,
          difficulty: "hard",
          category: "Programming"
        }
      ],
      settings: {
        timeLimit: 50,
        passingScore: 65,
        randomizeQuestions: true,
        randomizeOptions: true,
        allowReview: true,
        showResults: true,
        antiCheating: true,
        autoGrading: true
      },
      schedule: {
        startDate: new Date("2025-12-01T00:00:00Z"),
        endDate: new Date("2026-01-01T00:00:00Z"),
        timezone: "UTC"
      },
      enrolledStudents: [],
      isActive: true,
      category: "Computing",
      tags: ["computers", "technology", "programming", "IT"]
    });

    console.log("Created sample exam");

    console.log("\n=== DATABASE SEEDED SUCCESSFULLY! ===");
    console.log("\n📚 SAMPLE EXAM CREATED:");
    console.log(`Title: ${sampleExam.title}`);
    console.log(`Access Code: ${sampleExam.accessCode}`);
    console.log(`\n🔗 EXAM LINK (Click to access):`);
    console.log(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/exam/${sampleExam.examLink}`);
    console.log(`\n👥 SAMPLE CREDENTIALS:`);
    console.log("Admin: admin@cadna.com / admin123");
    console.log("Instructor: instructor@cadna.com / instructor123");
    console.log("Student 1: alice@student.com / student123");
    console.log("Student 2: bob@student.com / student123");
    console.log("\n📋 INSTRUCTIONS:");
    console.log("1. Login as a student (alice@student.com / student123)");
    console.log("2. Click the exam link above");
    console.log("3. You'll be auto-enrolled and can start the exam!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedDatabase();
