const mongoose = require('mongoose');
const crypto = require('crypto');

// Simple user schema
const userSchema = new mongoose.Schema({
  email: String,
  emailVerified: Date,
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  name: String,
  createdAt: Date,
});

const UserModel = mongoose.model('User', userSchema);

async function resetVerificationToken(email) {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://rakeshsingh432165:OSAYh8Lxz6GRo4lB@mern-cluster.orhbutd.mongodb.net/timelineDB?retryWrites=true&w=majority&appName=MERN-Cluster';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    // Generate new verification token
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 1000 * 60 * 45); // 45 minutes from now

    // Update the user
    user.emailVerificationToken = newToken;
    user.emailVerificationTokenExpires = newExpiry;
    user.emailVerified = null; // Reset verification status
    await user.save();

    console.log(`\n✅ Reset verification token for ${email}`);
    console.log(`New token: ${newToken}`);
    console.log(`Expires: ${newExpiry}`);
    console.log(`\nNew verification URL:`);
    console.log(
      `http://localhost:3000/verify-email?token=${newToken}&email=${encodeURIComponent(email)}`
    );

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node reset-verification.js <email>');
  console.log(
    'Example: node reset-verification.js 5n4fi.test@inbox.testmail.app'
  );
  process.exit(1);
}

resetVerificationToken(email);

