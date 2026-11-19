// Run once:  npm run seed
// Creates an admin, some students, rooms and a sample menu so you can try the app.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Room = require('./models/Room');
const { Menu } = require('./models/Mess');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const adminHash = await bcrypt.hash('admin123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  if (!(await User.findOne({ email: 'admin@hostel.com' }))) {
    await User.create({ name: 'Warden', email: 'admin@hostel.com', password: adminHash, role: 'admin' });
  }

  const students = [
    ['Sameer T', 'sameer@hostel.com', '1RG22CS001'],
    ['Saquib Baig', 'saquib@hostel.com', '1RG22CS002'],
    ['Syed Raiyan Ahmed', 'raiyan@hostel.com', '1RG22CS003'],
  ];
  for (const [name, email, rollNo] of students) {
    if (!(await User.findOne({ email }))) {
      await User.create({ name, email, password: studentHash, role: 'student', rollNo, branch: 'CSE', year: 3 });
    }
  }

  for (const roomNo of ['101', '102', '103', '201', '202']) {
    if (!(await Room.findOne({ roomNo }))) {
      await Room.create({ roomNo, block: 'A', floor: Number(roomNo[0]), capacity: 2 });
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = { Breakfast: 'Idli, Sambar, Chutney', Lunch: 'Rice, Dal, Sabzi, Curd', Dinner: 'Chapati, Paneer Curry' };
  for (const day of days) {
    for (const meal of Object.keys(meals)) {
      await Menu.findOneAndUpdate({ day, meal }, { items: meals[meal] }, { upsert: true });
    }
  }

  console.log('Done! Admin: admin@hostel.com / admin123   Student: sameer@hostel.com / student123');
  process.exit();
}

run();
