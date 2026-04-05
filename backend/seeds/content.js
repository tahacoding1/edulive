require('dotenv').config();
const mongoose = require('mongoose');
const Content  = require('../models/Content');

const defaultContent = [
  {
    section: 'hero',
    data: {
      badge:    '🚀 Next-Gen Virtual Learning',
      title:    'Teach & Learn Without Limits',
      subtitle: 'EduLive brings your classroom online with real-time whiteboard, live video, assignments, and smart collaboration tools — all in one place.',
      cta:      'Start Teaching Free',
      ctaSub:   'Join as Student',
      stats: [
        { value: '10K+', label: 'Active Users'    },
        { value: '500+', label: 'Classrooms'      },
        { value: '99.9%', label: 'Uptime'         },
        { value: '4.9★', label: 'Rated by Users'  },
      ],
    },
  },
  {
    section: 'about',
    data: {
      tag:   'About EduLive',
      title: 'Built for Modern Education',
      description:
        'EduLive was created to solve the biggest challenge in online education — engagement. We combine real-time collaboration tools with an intuitive interface so teachers can focus on teaching and students can focus on learning.',
      features: [
        { icon: '🎯', title: 'Purpose-Built',    desc: 'Designed specifically for educators and students, not repurposed from generic video tools.' },
        { icon: '⚡', title: 'Real-Time',        desc: 'Zero-latency whiteboard, instant messaging, and live video keep everyone in sync.' },
        { icon: '🔒', title: 'Secure',           desc: 'Password-protected rooms, JWT authentication, and role-based access control.' },
        { icon: '📱', title: 'Works Everywhere', desc: 'Fully responsive — use on desktop, tablet, or mobile without installing anything.' },
      ],
    },
  },
  {
    section: 'services',
    data: {
      tag:   'What We Offer',
      title: 'Everything You Need to Run a Virtual Classroom',
      items: [
        { icon: '🖊', title: 'Live Whiteboard',     desc: 'Collaborate in real time with a multi-tool canvas. Draw, erase, undo — all synced instantly across all participants.' },
        { icon: '📹', title: 'HD Video & Audio',    desc: 'Start your camera or share your screen with one click. Crystal-clear peer-to-peer streaming without plugins.' },
        { icon: '💬', title: 'Live Chat',           desc: 'Persistent chat history saved to database. Never miss a message — scroll back through the full conversation.' },
        { icon: '📋', title: 'Assignments',         desc: 'Post tasks with deadlines. Students submit files directly. Teachers review submissions from the admin panel.' },
        { icon: '👥', title: 'Participant Control', desc: 'See who is in the room, manage raised hands, mute participants, and remove disruptive students.' },
        { icon: '🔐', title: 'Secure Rooms',        desc: 'Every classroom gets a unique Room ID and a randomly generated password. Only invited students can join.' },
      ],
    },
  },
  {
    section: 'faq',
    data: {
      tag:   'FAQ',
      title: 'Frequently Asked Questions',
      items: [
        { q: 'How do students join a classroom?',      a: 'Students receive a Room ID and Password from their teacher. They log in to EduLive and enter those credentials on the dashboard.' },
        { q: 'Can I use EduLive on a mobile device?',  a: 'Yes! EduLive is fully responsive and works on smartphones, tablets, and desktops.' },
        { q: 'Is there a limit on class size?',        a: 'Currently EduLive supports up to 50 simultaneous participants per classroom.' },
        { q: 'Where are assignments and files stored?', a: 'All assignments, submissions, and messages are stored securely in our MongoDB database. Your data is never lost.' },
        { q: 'How does the admin panel work?',         a: 'Admins can manage all users, assign roles (student/teacher/admin), view all classrooms, and edit website content — all from a dedicated panel.' },
        { q: 'Can I record a session?',                a: 'Session recording is on our roadmap. Currently you can share your screen and all whiteboard activity is visible live.' },
      ],
    },
  },
  {
    section: 'contact',
    data: {
      tag:     'Get in Touch',
      title:   "We'd Love to Hear From You",
      subtitle:'Have a question, suggestion, or need help? Reach out to us.',
      email:   'support@edulive.app',
      phone:   '+1 (555) 123-4567',
      address: '123 Innovation Drive, Silicon Valley, CA 94025',
      social: [
        { platform: 'Twitter',  handle: '@eduliveapp',  url: '#' },
        { platform: 'LinkedIn', handle: 'EduLive',      url: '#' },
        { platform: 'GitHub',   handle: 'edulive',      url: '#' },
      ],
    },
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const item of defaultContent) {
    await Content.findOneAndUpdate(
      { section: item.section },
      { data: item.data },
      { upsert: true, new: true }
    );
    console.log(`✅  Seeded section: ${item.section}`);
  }

  console.log('\n🌱  Content seeded successfully!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
