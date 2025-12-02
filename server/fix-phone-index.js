import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function fixPhoneIndex() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not set');
    
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { dbName: 'secure_exam' });
    
    const db = mongoose.connection.db;
    
    console.log('Checking existing indexes on Users collection...');
    const indexes = await db.collection('users').getIndexes();
    console.log('Current indexes:', Object.keys(indexes));
    
    // Drop the unique index on phone if it exists
    if (indexes['phone_1']) {
      console.log('Found unique phone index, dropping it...');
      await db.collection('users').dropIndex('phone_1');
      console.log('✅ Dropped phone unique index');
    } else {
      console.log('No phone index found, skipping...');
    }
    
    // Verify the fix
    const newIndexes = await db.collection('users').getIndexes();
    console.log('Updated indexes:', Object.keys(newIndexes));
    
    console.log('\n✅ Database migration complete!');
    console.log('Phone numbers can now be reused across multiple users (different roles)');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing phone index:', error.message);
    process.exit(1);
  }
}

fixPhoneIndex();
