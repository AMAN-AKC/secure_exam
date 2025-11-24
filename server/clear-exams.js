import dotenv from 'dotenv';
import { Exam } from './src/models/Exam.js';
import { Registration } from './src/models/Registration.js';
import { Result } from './src/models/Result.js';
import { connectDb } from './src/config/db.js';

dotenv.config();

async function clearAllExams() {
  try {
    await connectDb();
    
    console.log('Clearing all exam data...');
    
    const examCount = await Exam.countDocuments();
    const regCount = await Registration.countDocuments();
    const resultCount = await Result.countDocuments();
    
    console.log(`Found: ${examCount} exams, ${regCount} registrations, ${resultCount} results`);
    
    await Exam.deleteMany({});
    await Registration.deleteMany({});
    await Result.deleteMany({});
    
    console.log('✓ All exam data cleared successfully');
    console.log('Database is now empty. Restart the server to begin with a clean slate.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearAllExams();
