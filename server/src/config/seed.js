import { User } from '../models/User.js';
import { Exam } from '../models/Exam.js';
import { hashPassword } from '../middlewares/auth.js';
import { sha256, aesEncrypt } from '../utils/crypto.js';

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function splitIntoChunks(arr, parts) {
  const result = [];
  const size = Math.ceil(arr.length / parts);
  for (let i = 0; i < parts; i++) {
    const start = i * size;
    const end = start + size;
    const chunk = arr.slice(start, end);
    if (chunk.length) result.push(chunk);
  }
  return result;
}

export async function seedAdminIfNeeded() {
  // Check if admin already exists by email
  const existing = await User.findOne({ email: 'admin@secureexam.com' });
  if (existing) return;

  // Create a known admin account for testing
  const email = 'admin@secureexam.com';
  const password = 'admin@123456';
  const passwordHash = await hashPassword(password);

  const admin = await User.create({ 
    name: 'Administrator', 
    email, 
    passwordHash, 
    role: 'admin',
    phone: '+919876543210',
    demoMode: true  // OTP will show in terminal for admin
  });

  console.log('✅ Admin account seeded (DEMO MODE - OTP in terminal)');
  console.log('📧 Email: admin@secureexam.com');
  console.log('🔑 Password: admin@123456');
}
}

export async function seedSampleData() {
  try {
    // Check if sample data already exists
    const existingExams = await Exam.countDocuments();
    if (existingExams > 0) {
      console.log('Sample data already exists, skipping seed.');
      return;
    }

    // Create sample teacher
    const teacherEmail = `teacher${randomString(3)}@secureexam.com`;
    const teacherPassword = randomString(8);
    const teacherPasswordHash = await hashPassword(teacherPassword);

    const teacher = await User.create({
      name: 'Sample Teacher',
      email: teacherEmail,
      passwordHash: teacherPasswordHash,
      role: 'teacher'
    });

    // Create sample student
    const studentEmail = `student${randomString(3)}@secureexam.com`;
    const studentPassword = randomString(8);
    const studentPasswordHash = await hashPassword(studentPassword);

    const student = await User.create({
      name: 'Sample Student',
      email: studentEmail,
      passwordHash: studentPasswordHash,
      role: 'student'
    });

    // Create sample questions for Math exam
    const mathQuestions = [
      {
        text: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctIndex: 1
      },
      {
        text: "What is the square root of 16?",
        options: ["2", "3", "4", "5"],
        correctIndex: 2
      },
      {
        text: "What is 10 × 5?",
        options: ["45", "50", "55", "60"],
        correctIndex: 1
      },
      {
        text: "What is 100 ÷ 4?",
        options: ["20", "25", "30", "35"],
        correctIndex: 1
      },
      {
        text: "What is 15% of 200?",
        options: ["25", "30", "35", "40"],
        correctIndex: 1
      }
    ];

    // Create sample questions for Science exam
    const scienceQuestions = [
      {
        text: "What is the chemical symbol for water?",
        options: ["HO", "H2O", "H3O", "HO2"],
        correctIndex: 1
      },
      {
        text: "What planet is closest to the Sun?",
        options: ["Venus", "Mercury", "Earth", "Mars"],
        correctIndex: 1
      },
      {
        text: "What gas do plants absorb from the atmosphere during photosynthesis?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctIndex: 2
      },
      {
        text: "What is the hardest natural substance?",
        options: ["Gold", "Iron", "Quartz", "Diamond"],
        correctIndex: 3
      },
      {
        text: "How many bones are in an adult human body?",
        options: ["186", "206", "226", "246"],
        correctIndex: 1
      }
    ];

    // Create and finalize Math exam
    const mathExam = await Exam.create({
      title: "Basic Mathematics Test",
      description: "A simple test covering basic arithmetic operations and percentages.",
      createdBy: teacher._id,
      status: 'draft',
      durationMinutes: 30,
      availableFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Available since yesterday
      availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Available for next 30 days
      allowLateEntry: true,
      shuffleQuestions: false,
      showResults: true,
      questions: mathQuestions
    });

    // Finalize Math exam
    const mathQuestionChunks = splitIntoChunks(mathExam.questions, 5);
    const mathChunks = [];
    let prevHash = 'GENESIS';

    mathQuestionChunks.forEach((qChunk, index) => {
      const payload = JSON.stringify({ questions: qChunk, prevHash, index });
      const currHash = sha256(payload);
      const enc = aesEncrypt(payload);
      mathChunks.push({ index, prevHash, hash: currHash, iv: enc.iv, cipherText: enc.cipherText });
      prevHash = currHash;
    });

    mathExam.chunks = mathChunks;
    mathExam.status = 'approved';
    await mathExam.save();

    // Create Science exam with custom result release date
    const scienceExam = await Exam.create({
      title: "General Science Quiz",
      description: "Test your knowledge of basic science concepts including chemistry, astronomy, biology, and physics.",
      createdBy: teacher._id,
      status: 'draft',
      durationMinutes: 45,
      availableFrom: new Date(Date.now() - 12 * 60 * 60 * 1000), // Available since 12 hours ago
      availableTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Available for next 45 days
      allowLateEntry: true,
      shuffleQuestions: true,
      showResults: true,
      resultsReleaseType: 'custom_date',
      resultsReleaseDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // Results available in 2 hours
      resultsReleaseMessage: "Great job! Here are your science quiz results.",
      questions: scienceQuestions
    });

    // Finalize Science exam
    const scienceQuestionChunks = splitIntoChunks(scienceExam.questions, 5);
    const scienceChunks = [];
    prevHash = 'GENESIS';

    scienceQuestionChunks.forEach((qChunk, index) => {
      const payload = JSON.stringify({ questions: qChunk, prevHash, index });
      const currHash = sha256(payload);
      const enc = aesEncrypt(payload);
      scienceChunks.push({ index, prevHash, hash: currHash, iv: enc.iv, cipherText: enc.cipherText });
      prevHash = currHash;
    });

    scienceExam.chunks = scienceChunks;
    scienceExam.status = 'approved';
    await scienceExam.save();

    // Create History exam with immediate results
    const historyQuestions = [
      {
        text: "In which year did World War II end?",
        options: ["1944", "1945", "1946", "1947"],
        correctIndex: 1
      },
      {
        text: "Who was the first President of the United States?",
        options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
        correctIndex: 1
      },
      {
        text: "In which year did the Berlin Wall fall?",
        options: ["1987", "1988", "1989", "1990"],
        correctIndex: 2
      }
    ];

    const historyExam = await Exam.create({
      title: "World History Quick Quiz",
      description: "Test your knowledge of important historical events and figures.",
      createdBy: teacher._id,
      status: 'draft',
      durationMinutes: 15,
      availableFrom: new Date(Date.now() - 6 * 60 * 60 * 1000), // Available since 6 hours ago
      availableTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Available for next 15 days
      allowLateEntry: true,
      shuffleQuestions: false,
      showResults: true,
      resultsReleaseType: 'immediate',
      resultsReleaseMessage: "Well done! Check how you did on this history quiz.",
      questions: historyQuestions
    });

    // Finalize History exam
    const historyQuestionChunks = splitIntoChunks(historyExam.questions, 5);
    const historyChunks = [];
    prevHash = 'GENESIS';

    historyQuestionChunks.forEach((qChunk, index) => {
      const payload = JSON.stringify({ questions: qChunk, prevHash, index });
      const currHash = sha256(payload);
      const enc = aesEncrypt(payload);
      historyChunks.push({ index, prevHash, hash: currHash, iv: enc.iv, cipherText: enc.cipherText });
      prevHash = currHash;
    });

    historyExam.chunks = historyChunks;
    historyExam.status = 'approved';
    await historyExam.save();

    console.log('Sample data seeded successfully!');
    console.log('\nSample Teacher credentials:');
    console.log({ email: teacherEmail, password: teacherPassword });
    console.log('\nSample Student credentials:');
    console.log({ email: studentEmail, password: studentPassword });
    console.log('\nCreated exams:');
    console.log('- Basic Mathematics Test (30 min, 5 questions) - Results after exam ends');
    console.log('- General Science Quiz (45 min, 5 questions) - Results in 2 hours');
    console.log('- World History Quick Quiz (15 min, 3 questions) - Immediate results');

  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}
