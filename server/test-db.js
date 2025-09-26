import { connectDb } from './src/config/db.js';
import { Exam } from './src/models/Exam.js';
import { User } from './src/models/User.js';

async function testDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDb();
    
    console.log('Checking users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\nChecking exams...');
    const exams = await Exam.find({});
    console.log(`Found ${exams.length} exams:`);
    exams.forEach(exam => {
      console.log(`- ${exam.title} - Status: ${exam.status} - Questions: ${exam.questions?.length || 0}`);
    });
    
    console.log('\nChecking approved exams specifically...');
    const approvedExams = await Exam.find({ status: 'approved' });
    console.log(`Found ${approvedExams.length} approved exams:`);
    approvedExams.forEach(exam => {
      console.log(`- ${exam.title} - Available from: ${exam.availableFrom} to: ${exam.availableTo}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDatabase();