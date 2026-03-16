import asyncHandler from "express-async-handler";
import Exam from "../models/examModel.js";
import User from "../models/userModel.js";
import crypto from "crypto";
import mongoose from "mongoose";
import ExamSession from "../models/examSessionModel.js";

// @desc    Seed database with sample exams
// @route   POST /api/admin/seed-exams
// @access  Private (Admin/Instructor only)
export const seedExams = asyncHandler(async (req, res) => {
  // Get an instructor from database
  const instructor = await req.user;

 

  // Get all students to auto-enroll them
  const students = await User.find({ role: "student" });
  const studentIds = students.map((student) => student._id);

  console.log(`Found ${students.length} students to enroll in exams`);

  // Delete existing mock exams (prevents duplicates)
  await Exam.deleteMany({
    title: {
      $in: [
        "Mathematics Exam",
        "Physics Exam",
        "Chemistry Exam",
        "Biology Exam",
      ],
    },
  });

  // Sample Exams Data - ALL 4 SUBJECTS WITH ISCORRECT FLAGS
  const examsData = [
    // ==================== MATHEMATICS EXAM (20 Questions) ====================
    {
      title: "Mathematics Exam",
      description:
        "Test your mathematical abilities with this comprehensive exam covering algebra, calculus, and geometry.",
      instructor: instructor._id,
      examLink: crypto.randomUUID(),
      accessCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      questions: [
        {
          type: "multiple-choice",
          question: "What is the derivative of x²?",
          options: [
            { text: "2x", value: "2x", isCorrect: true },
            { text: "x", value: "x", isCorrect: false },
            { text: "2", value: "2", isCorrect: false },
            { text: "x²", value: "x²", isCorrect: false },
          ],
          correctAnswer: "2x",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "Solve for x: 2x + 5 = 13",
          options: [
            { text: "4", value: "4", isCorrect: true },
            { text: "5", value: "5", isCorrect: false },
            { text: "6", value: "6", isCorrect: false },
            { text: "8", value: "8", isCorrect: false },
          ],
          correctAnswer: "4",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "The sum of angles in a triangle is 180 degrees.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the value of π (pi) approximately?",
          options: [
            { text: "3.14", value: "3.14", isCorrect: true },
            { text: "2.71", value: "2.71", isCorrect: false },
            { text: "1.41", value: "1.41", isCorrect: false },
            { text: "1.73", value: "1.73", isCorrect: false },
          ],
          correctAnswer: "3.14",
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is 15% of 200?",
          options: [
            { text: "25", value: "25", isCorrect: false },
            { text: "30", value: "30", isCorrect: true },
            { text: "35", value: "35", isCorrect: false },
            { text: "40", value: "40", isCorrect: false },
          ],
          correctAnswer: "30",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question:
            "Calculate the area of a circle with radius 5 cm. (Use π = 3.14)",
          correctAnswer: "78.5",
          points: 3,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the quadratic formula?",
          options: [
            {
              text: "x = (-b ± √(b²-4ac)) / 2a",
              value: "quadratic",
              isCorrect: true,
            },
            { text: "x = -b / 2a", value: "simple", isCorrect: false },
            { text: "x = b² - 4ac", value: "discriminant", isCorrect: false },
            { text: "x = a² + b²", value: "pythagorean", isCorrect: false },
          ],
          correctAnswer: "quadratic",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "true-false",
          question: "A prime number has exactly two distinct factors.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the slope of a horizontal line?",
          options: [
            { text: "0", value: "0", isCorrect: true },
            { text: "1", value: "1", isCorrect: false },
            { text: "undefined", value: "undefined", isCorrect: false },
            { text: "infinity", value: "infinity", isCorrect: false },
          ],
          correctAnswer: "0",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "If f(x) = 3x + 2, what is f(4)?",
          correctAnswer: "14",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the Pythagorean theorem?",
          options: [
            { text: "a² + b² = c²", value: "pythagoras", isCorrect: true },
            { text: "a + b = c", value: "linear", isCorrect: false },
            { text: "a² - b² = c²", value: "difference", isCorrect: false },
            { text: "ab = c", value: "product", isCorrect: false },
          ],
          correctAnswer: "pythagoras",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the value of sin(90°)?",
          options: [
            { text: "0", value: "0", isCorrect: false },
            { text: "0.5", value: "0.5", isCorrect: false },
            { text: "1", value: "1", isCorrect: true },
            { text: "√3/2", value: "sqrt3", isCorrect: false },
          ],
          correctAnswer: "1",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "true-false",
          question: "The logarithm of 1 (log 1) equals 0.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the factorial of 5 (5!)?",
          options: [
            { text: "120", value: "120", isCorrect: true },
            { text: "60", value: "60", isCorrect: false },
            { text: "24", value: "24", isCorrect: false },
            { text: "20", value: "20", isCorrect: false },
          ],
          correctAnswer: "120",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "Simplify: (x³ × x²)",
          correctAnswer: "x⁵",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the volume of a cube with side length 3?",
          options: [
            { text: "9", value: "9", isCorrect: false },
            { text: "18", value: "18", isCorrect: false },
            { text: "27", value: "27", isCorrect: true },
            { text: "81", value: "81", isCorrect: false },
          ],
          correctAnswer: "27",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "All squares are rectangles.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is 7²?",
          options: [
            { text: "14", value: "14", isCorrect: false },
            { text: "49", value: "49", isCorrect: true },
            { text: "21", value: "21", isCorrect: false },
            { text: "56", value: "56", isCorrect: false },
          ],
          correctAnswer: "49",
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the median of: 3, 7, 8, 12, 15?",
          options: [
            { text: "7", value: "7", isCorrect: false },
            { text: "8", value: "8", isCorrect: true },
            { text: "9", value: "9", isCorrect: false },
            { text: "12", value: "12", isCorrect: false },
          ],
          correctAnswer: "8",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "Convert 0.75 to a fraction in simplest form.",
          correctAnswer: "3/4",
          points: 2,
          difficulty: "medium",
        },
      ],
      settings: {
        timeLimit: 7,
        passingScore: 60,
        randomizeQuestions: true,
        showResults: true,
        autoGrading: true,
      },
      schedule: {
        startDate: new Date("2026-03-14T09:00:00"),
        endDate: new Date("2026-12-12T11:00:00"),
      },
      enrolledStudents: studentIds,
    },

    // ==================== PHYSICS EXAM (20 Questions) ====================
    {
      title: "Physics Exam",
      description:
        "Challenge your understanding of physics concepts, including mechanics, thermodynamics, and electromagnetism.",
      instructor: instructor._id,
      examLink: crypto.randomUUID(),
      accessCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      questions: [
        {
          type: "multiple-choice",
          question: "What is the SI unit of force?",
          options: [
            { text: "Joule", value: "joule", isCorrect: false },
            { text: "Newton", value: "newton", isCorrect: true },
            { text: "Watt", value: "watt", isCorrect: false },
            { text: "Pascal", value: "pascal", isCorrect: false },
          ],
          correctAnswer: "newton",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the speed of light in vacuum?",
          options: [
            { text: "3 × 10⁸ m/s", value: "3e8", isCorrect: true },
            { text: "3 × 10⁶ m/s", value: "3e6", isCorrect: false },
            { text: "3 × 10¹⁰ m/s", value: "3e10", isCorrect: false },
            { text: "3 × 10⁴ m/s", value: "3e4", isCorrect: false },
          ],
          correctAnswer: "3e8",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question:
            "Newton's first law states that an object at rest stays at rest unless acted upon by an external force.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the formula for kinetic energy?",
          options: [
            { text: "½mv²", value: "kinetic", isCorrect: true },
            { text: "mv", value: "momentum", isCorrect: false },
            { text: "mgh", value: "potential", isCorrect: false },
            { text: "F = ma", value: "force", isCorrect: false },
          ],
          correctAnswer: "kinetic",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question:
            "Calculate the acceleration of an object if force is 10N and mass is 2kg.",
          correctAnswer: "5",
          points: 3,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the SI unit of electric current?",
          options: [
            { text: "Ampere", value: "ampere", isCorrect: true },
            { text: "Volt", value: "volt", isCorrect: false },
            { text: "Ohm", value: "ohm", isCorrect: false },
            { text: "Coulomb", value: "coulomb", isCorrect: false },
          ],
          correctAnswer: "ampere",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Energy can be created or destroyed.",
          options: [
            { text: "True", value: "true", isCorrect: false },
            { text: "False", value: "false", isCorrect: true },
          ],
          correctAnswer: false,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is Ohm's law?",
          options: [
            { text: "V = IR", value: "ohm", isCorrect: true },
            { text: "F = ma", value: "newton", isCorrect: false },
            { text: "E = mc²", value: "einstein", isCorrect: false },
            { text: "P = IV", value: "power", isCorrect: false },
          ],
          correctAnswer: "ohm",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the acceleration due to gravity on Earth?",
          options: [
            { text: "9.8 m/s²", value: "9.8", isCorrect: true },
            { text: "10 m/s²", value: "10", isCorrect: false },
            { text: "8.9 m/s²", value: "8.9", isCorrect: false },
            { text: "11 m/s²", value: "11", isCorrect: false },
          ],
          correctAnswer: "9.8",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "short-answer",
          question:
            "What is the potential energy of a 5kg object at height 10m? (g = 10 m/s²)",
          correctAnswer: "500",
          points: 3,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What type of lens is used to correct myopia?",
          options: [
            { text: "Concave", value: "concave", isCorrect: true },
            { text: "Convex", value: "convex", isCorrect: false },
            { text: "Cylindrical", value: "cylindrical", isCorrect: false },
            { text: "Bifocal", value: "bifocal", isCorrect: false },
          ],
          correctAnswer: "concave",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "true-false",
          question: "Sound travels faster in water than in air.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the first law of thermodynamics?",
          options: [
            {
              text: "Energy cannot be created or destroyed",
              value: "first",
              isCorrect: true,
            },
            {
              text: "Entropy always increases",
              value: "second",
              isCorrect: false,
            },
            {
              text: "Heat flows from hot to cold",
              value: "zeroth",
              isCorrect: false,
            },
            {
              text: "Force equals mass times acceleration",
              value: "newton",
              isCorrect: false,
            },
          ],
          correctAnswer: "first",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the SI unit of power?",
          options: [
            { text: "Watt", value: "watt", isCorrect: true },
            { text: "Joule", value: "joule", isCorrect: false },
            { text: "Newton", value: "newton", isCorrect: false },
            { text: "Volt", value: "volt", isCorrect: false },
          ],
          correctAnswer: "watt",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "short-answer",
          question:
            "Calculate work done if force is 20N and displacement is 5m in the direction of force.",
          correctAnswer: "100",
          points: 3,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the wavelength range of visible light?",
          options: [
            { text: "400-700 nm", value: "visible", isCorrect: true },
            { text: "100-400 nm", value: "uv", isCorrect: false },
            { text: "700-1000 nm", value: "infrared", isCorrect: false },
            { text: "1-100 nm", value: "xray", isCorrect: false },
          ],
          correctAnswer: "visible",
          points: 2,
          difficulty: "hard",
        },
        {
          type: "true-false",
          question: "A convex mirror always forms a virtual image.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the frequency of AC in most countries?",
          options: [
            { text: "50 Hz", value: "50", isCorrect: false },
            { text: "60 Hz", value: "60", isCorrect: false },
            { text: "50-60 Hz", value: "50-60", isCorrect: true },
            { text: "100 Hz", value: "100", isCorrect: false },
          ],
          correctAnswer: "50-60",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the charge of an electron?",
          options: [
            { text: "-1.6 × 10⁻¹⁹ C", value: "negative", isCorrect: true },
            { text: "1.6 × 10⁻¹⁹ C", value: "positive", isCorrect: false },
            { text: "-1.6 × 10⁻²⁹ C", value: "wrong1", isCorrect: false },
            { text: "Zero", value: "zero", isCorrect: false },
          ],
          correctAnswer: "negative",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "What is momentum if mass is 4kg and velocity is 15 m/s?",
          correctAnswer: "60",
          points: 2,
          difficulty: "easy",
        },
      ],
      settings: {
        timeLimit: 7,
        passingScore: 65,
        randomizeQuestions: true,
        showResults: true,
        autoGrading: true,
      },
      schedule: {
        startDate: new Date("2026-03-14T09:00:00"),
        endDate: new Date("2026-12-12T11:00:00"),
      },
      enrolledStudents: studentIds,
    },

    // ==================== CHEMISTRY EXAM (20 Questions) ====================
    {
      title: "Chemistry Exam",
      description:
        "Assess your knowledge of chemistry, covering topics such as atomic structure, chemical reactions, and organic chemistry.",
      instructor: instructor._id,
      examLink: crypto.randomUUID(),
      accessCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      questions: [
        {
          type: "multiple-choice",
          question: "What is the atomic number of Carbon?",
          options: [
            { text: "6", value: "6", isCorrect: true },
            { text: "12", value: "12", isCorrect: false },
            { text: "8", value: "8", isCorrect: false },
            { text: "14", value: "14", isCorrect: false },
          ],
          correctAnswer: "6",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the chemical formula for water?",
          options: [
            { text: "H₂O", value: "h2o", isCorrect: true },
            { text: "CO₂", value: "co2", isCorrect: false },
            { text: "O₂", value: "o2", isCorrect: false },
            { text: "H₂", value: "h2", isCorrect: false },
          ],
          correctAnswer: "h2o",
          points: 1,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Acids have a pH less than 7.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the most abundant gas in Earth's atmosphere?",
          options: [
            { text: "Nitrogen", value: "nitrogen", isCorrect: true },
            { text: "Oxygen", value: "oxygen", isCorrect: false },
            { text: "Carbon Dioxide", value: "co2", isCorrect: false },
            { text: "Argon", value: "argon", isCorrect: false },
          ],
          correctAnswer: "nitrogen",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "short-answer",
          question: "What is the valency of Oxygen?",
          correctAnswer: "2",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the pH of a neutral solution?",
          options: [
            { text: "7", value: "7", isCorrect: true },
            { text: "0", value: "0", isCorrect: false },
            { text: "14", value: "14", isCorrect: false },
            { text: "1", value: "1", isCorrect: false },
          ],
          correctAnswer: "7",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Noble gases are highly reactive.",
          options: [
            { text: "True", value: "true", isCorrect: false },
            { text: "False", value: "false", isCorrect: true },
          ],
          correctAnswer: false,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the formula for methane?",
          options: [
            { text: "CH₄", value: "ch4", isCorrect: true },
            { text: "C₂H₆", value: "c2h6", isCorrect: false },
            { text: "C₃H₈", value: "c3h8", isCorrect: false },
            { text: "CH₃OH", value: "ch3oh", isCorrect: false },
          ],
          correctAnswer: "ch4",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question:
            "What type of bond exists between hydrogen and oxygen in water?",
          options: [
            { text: "Covalent", value: "covalent", isCorrect: true },
            { text: "Ionic", value: "ionic", isCorrect: false },
            { text: "Metallic", value: "metallic", isCorrect: false },
            { text: "Van der Waals", value: "vdw", isCorrect: false },
          ],
          correctAnswer: "covalent",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "How many electrons can the second shell hold maximum?",
          correctAnswer: "8",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the symbol for Gold?",
          options: [
            { text: "Au", value: "au", isCorrect: true },
            { text: "Ag", value: "ag", isCorrect: false },
            { text: "Go", value: "go", isCorrect: false },
            { text: "Gd", value: "gd", isCorrect: false },
          ],
          correctAnswer: "au",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Sodium chloride (NaCl) is table salt.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the process of a solid changing directly to gas?",
          options: [
            { text: "Sublimation", value: "sublimation", isCorrect: true },
            { text: "Evaporation", value: "evaporation", isCorrect: false },
            { text: "Condensation", value: "condensation", isCorrect: false },
            { text: "Deposition", value: "deposition", isCorrect: false },
          ],
          correctAnswer: "sublimation",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is Avogadro's number?",
          options: [
            { text: "6.022 × 10²³", value: "avogadro", isCorrect: true },
            { text: "3.14", value: "pi", isCorrect: false },
            { text: "9.8", value: "gravity", isCorrect: false },
            { text: "1.6 × 10⁻¹⁹", value: "electron", isCorrect: false },
          ],
          correctAnswer: "avogadro",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "What is the atomic number of Hydrogen?",
          correctAnswer: "1",
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "Which of these is a noble gas?",
          options: [
            { text: "Helium", value: "helium", isCorrect: true },
            { text: "Oxygen", value: "oxygen", isCorrect: false },
            { text: "Nitrogen", value: "nitrogen", isCorrect: false },
            { text: "Chlorine", value: "chlorine", isCorrect: false },
          ],
          correctAnswer: "helium",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Water boils at 100°C at sea level.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the formula for sulfuric acid?",
          options: [
            { text: "H₂SO₄", value: "h2so4", isCorrect: true },
            { text: "HCl", value: "hcl", isCorrect: false },
            { text: "HNO₃", value: "hno3", isCorrect: false },
            { text: "H₂CO₃", value: "h2co3", isCorrect: false },
          ],
          correctAnswer: "h2so4",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "What is the charge of a proton?",
          options: [
            { text: "Positive", value: "positive", isCorrect: true },
            { text: "Negative", value: "negative", isCorrect: false },
            { text: "Neutral", value: "neutral", isCorrect: false },
            { text: "Variable", value: "variable", isCorrect: false },
          ],
          correctAnswer: "positive",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "short-answer",
          question: "How many protons does Nitrogen have?",
          correctAnswer: "7",
          points: 2,
          difficulty: "easy",
        },
      ],
      settings: {
        timeLimit: 7,
        passingScore: 60,
        randomizeQuestions: true,
        showResults: true,
        autoGrading: true,
      },
      schedule: {
        startDate: new Date("2026-03-14T09:00:00"),
        endDate: new Date("2026-12-12T11:00:00"),
      },
      enrolledStudents: studentIds,
    },

    // ==================== BIOLOGY EXAM (20 Questions) ====================
    {
      title: "Biology Exam",
      description:
        "Evaluate your understanding of biology, including cell biology, genetics, and ecology.",
      instructor: instructor._id,
      examLink: crypto.randomUUID(),
      accessCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      questions: [
        {
          type: "multiple-choice",
          question: "What is the powerhouse of the cell?",
          options: [
            { text: "Mitochondria", value: "mitochondria", isCorrect: true },
            { text: "Nucleus", value: "nucleus", isCorrect: false },
            { text: "Ribosome", value: "ribosome", isCorrect: false },
            { text: "Chloroplast", value: "chloroplast", isCorrect: false },
          ],
          correctAnswer: "mitochondria",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the basic unit of life?",
          options: [
            { text: "Cell", value: "cell", isCorrect: true },
            { text: "Tissue", value: "tissue", isCorrect: false },
            { text: "Organ", value: "organ", isCorrect: false },
            { text: "Atom", value: "atom", isCorrect: false },
          ],
          correctAnswer: "cell",
          points: 1,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "DNA stands for Deoxyribonucleic Acid.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "How many chromosomes do humans have?",
          options: [
            { text: "46", value: "46", isCorrect: true },
            { text: "23", value: "23", isCorrect: false },
            { text: "48", value: "48", isCorrect: false },
            { text: "44", value: "44", isCorrect: false },
          ],
          correctAnswer: "46",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "short-answer",
          question: "What process do plants use to make food?",
          correctAnswer: "Photosynthesis",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the largest organ in the human body?",
          options: [
            { text: "Skin", value: "skin", isCorrect: true },
            { text: "Liver", value: "liver", isCorrect: false },
            { text: "Heart", value: "heart", isCorrect: false },
            { text: "Brain", value: "brain", isCorrect: false },
          ],
          correctAnswer: "skin",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "All living things are made of cells.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the process of cell division called?",
          options: [
            { text: "Mitosis", value: "mitosis", isCorrect: false },
            { text: "Meiosis", value: "meiosis", isCorrect: false },
            { text: "Both A and B", value: "both", isCorrect: true },
            {
              text: "Photosynthesis",
              value: "photosynthesis",
              isCorrect: false,
            },
          ],
          correctAnswer: "both",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question: "Which blood type is known as the universal donor?",
          options: [
            { text: "O negative", value: "o-negative", isCorrect: true },
            { text: "AB positive", value: "ab-positive", isCorrect: false },
            { text: "A positive", value: "a-positive", isCorrect: false },
            { text: "B negative", value: "b-negative", isCorrect: false },
          ],
          correctAnswer: "o-negative",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "What is the main gas exchanged in respiration?",
          correctAnswer: "Oxygen",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What carries genetic information?",
          options: [
            { text: "DNA", value: "dna", isCorrect: true },
            { text: "RNA", value: "rna", isCorrect: false },
            { text: "Protein", value: "protein", isCorrect: false },
            { text: "Carbohydrate", value: "carbohydrate", isCorrect: false },
          ],
          correctAnswer: "dna",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Humans have four chambers in their heart.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the study of plants called?",
          options: [
            { text: "Botany", value: "botany", isCorrect: true },
            { text: "Zoology", value: "zoology", isCorrect: false },
            { text: "Ecology", value: "ecology", isCorrect: false },
            { text: "Genetics", value: "genetics", isCorrect: false },
          ],
          correctAnswer: "botany",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "Which organelle performs photosynthesis?",
          options: [
            { text: "Chloroplast", value: "chloroplast", isCorrect: true },
            { text: "Mitochondria", value: "mitochondria", isCorrect: false },
            { text: "Nucleus", value: "nucleus", isCorrect: false },
            { text: "Ribosome", value: "ribosome", isCorrect: false },
          ],
          correctAnswer: "chloroplast",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "What is the normal human body temperature in Celsius?",
          correctAnswer: "37",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What is the function of red blood cells?",
          options: [
            { text: "Carry oxygen", value: "oxygen", isCorrect: true },
            { text: "Fight infection", value: "infection", isCorrect: false },
            { text: "Clot blood", value: "clot", isCorrect: false },
            { text: "Produce hormones", value: "hormones", isCorrect: false },
          ],
          correctAnswer: "oxygen",
          points: 2,
          difficulty: "easy",
        },
        {
          type: "true-false",
          question: "Vaccines help the immune system fight diseases.",
          options: [
            { text: "True", value: "true", isCorrect: true },
            { text: "False", value: "false", isCorrect: false },
          ],
          correctAnswer: true,
          points: 1,
          difficulty: "easy",
        },
        {
          type: "multiple-choice",
          question: "What kingdom do mushrooms belong to?",
          options: [
            { text: "Fungi", value: "fungi", isCorrect: true },
            { text: "Plantae", value: "plantae", isCorrect: false },
            { text: "Animalia", value: "animalia", isCorrect: false },
            { text: "Protista", value: "protista", isCorrect: false },
          ],
          correctAnswer: "fungi",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "multiple-choice",
          question:
            "Which vitamin is produced when skin is exposed to sunlight?",
          options: [
            { text: "Vitamin D", value: "Vitamin d", isCorrect: true },
            { text: "Vitamin C", value: "Vitamin c", isCorrect: false },
            { text: "Vitamin A", value: "Vitamin a", isCorrect: false },
            { text: "Vitamin E", value: "Vitamin e", isCorrect: false },
          ],
          correctAnswer: "Vitamin d",
          points: 2,
          difficulty: "medium",
        },
        {
          type: "short-answer",
          question: "How many bones are in the adult human body?",
          correctAnswer: "206",
          points: 2,
          difficulty: "medium",
        },
      ],
      settings: {
        timeLimit: 7,
        passingScore: 60,
        randomizeQuestions: true,
        showResults: true,
        autoGrading: true,
      },
      schedule: {
        startDate: new Date("2026-03-14T09:00:00"),
        endDate: new Date("2026-12-12T11:00:00"),
      },
      enrolledStudents: studentIds,
      examLink: crypto.randomUUID(),
      accessCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
    },
  ];

  // Insert exams into database
  const createdExams = await Exam.insertMany(examsData);

  res.status(201).json({
    success: true,
    message: `Successfully created ${createdExams.length} sample exams and enrolled ${students.length} students`,
    data: {
      count: createdExams.length,
      studentsEnrolled: students.length,
      exams: createdExams.map((exam) => ({
        id: exam._id,
        title: exam.title,
        questionCount: exam.questions.length,
        timeLimit: exam.settings.timeLimit,
      })),
    },
  });
});

// @desc    Delete all sample exams
// @route   DELETE /api/admin/seed-exams
// @access  Private (Admin only)
export const deleteSeedExams = asyncHandler(async (req, res) => {
  const result = await Exam.deleteMany({
    title: {
      $in: [
        "Mathematics Exam",
        "Physics Exam",
        "Chemistry Exam",
        "Biology Exam",
      ],
    },
  });

  res.json({
    success: true,
    message: `Deleted ${result.deletedCount} sample exams`,
  });
});
