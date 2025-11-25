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
      dbName: "cadna-backend",
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
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics",
      instructor: instructor._id,
      examLink: examLink,
      accessCode: accessCode,
      questions: [
        {
          type: "multiple-choice",
          question:
            "What is the correct way to declare a variable in JavaScript?",
          options: [
            { text: "var myVar = 5;", isCorrect: true },
            { text: "variable myVar = 5;", isCorrect: false },
            { text: "v myVar = 5;", isCorrect: false },
            { text: "declare myVar = 5;", isCorrect: false },
          ],
          points: 2,
          difficulty: "easy",
          category: "Variables",
        },
        {
          type: "multiple-choice",
          question:
            "Which method is used to add an element to the end of an array?",
          options: [
            { text: "push()", isCorrect: true },
            { text: "pop()", isCorrect: false },
            { text: "shift()", isCorrect: false },
            { text: "unshift()", isCorrect: false },
          ],
          points: 2,
          difficulty: "easy",
          category: "Arrays",
        },
        {
          type: "true-false",
          question: "JavaScript is a statically typed language.",
          options: [
            { text: "True", isCorrect: false },
            { text: "False", isCorrect: true },
          ],
          points: 1,
          difficulty: "medium",
          category: "Language Features",
        },
        {
          type: "short-answer",
          question: "What does DOM stand for?",
          correctAnswer: "Document Object Model",
          points: 3,
          difficulty: "medium",
          category: "Web APIs",
        },
      ],
      settings: {
        timeLimit: 30,
        passingScore: 70,
        randomizeQuestions: true,
        randomizeOptions: true,
        allowReview: true,
        showResults: true,
        antiCheating: true,
        autoGrading: true,
      },
      schedule: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        timezone: "UTC",
      },
      enrolledStudents: [students[0]._id, students[1]._id],
      isActive: true,
      category: "Programming",
      tags: ["javascript", "fundamentals", "web-development"],
    });

    console.log("Created sample exam");

    console.log("\n=== DATABASE SEEDED SUCCESSFULLY! ===");
    console.log("\n📚 SAMPLE EXAM CREATED:");
    console.log(`Title: ${sampleExam.title}`);
    console.log(`Access Code: ${sampleExam.accessCode}`);
    console.log(`\n🔗 EXAM LINK (Click to access):`);
    console.log(`http://localhost:5173/exam/${sampleExam.examLink}`);
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
