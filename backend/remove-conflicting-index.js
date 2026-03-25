const mongoose = require('mongoose');

// Use the same connection string as your test environment
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://rakeshsingh432165:OSAYh8Lxz6GRo4lB@mern-cluster.orhbutd.mongodb.net/timelineDB?retryWrites=true&w=majority&appName=MERN-Cluster';

async function removeConflictingIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // List all indexes on the accounts collection
    const indexes = await db.collection('accounts').indexes();
    console.log('\n📋 Current indexes on accounts collection:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
    });

    // Find the conflicting index
    const conflictingIndex = indexes.find(index => 
      index.name === 'provider_1_providerAccountId_1'
    );

    if (conflictingIndex) {
      console.log('\n🚨 Found conflicting index:', conflictingIndex.name);
      console.log('🗑️  Dropping index...');
      
      // Drop the conflicting index
      await db.collection('accounts').dropIndex('provider_1_providerAccountId_1');
      console.log('✅ Successfully dropped conflicting index');
    } else {
      console.log('\n✅ No conflicting index found');
    }

    // List indexes again to confirm
    const updatedIndexes = await db.collection('accounts').indexes();
    console.log('\n📋 Updated indexes on accounts collection:');
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure MongoDB is running on localhost:27017');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the script
console.log('🔧 Starting index cleanup script...\n');
removeConflictingIndex();
