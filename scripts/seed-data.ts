import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function seedData() {
  console.log('Starting seed data...')

  try {
    // Seed Announcements
    console.log('Seeding announcements...')
    const announcements = [
      {
        title: 'Hackathon 2024 - Register Now!',
        type: 'hackathon',
        description: 'Join our annual hackathon and win exciting prizes',
        link: 'https://example.com/hackathon',
        expiryDate: new Date('2024-12-31'),
        createdAt: serverTimestamp(),
      },
      {
        title: 'Python Developers in High Demand',
        type: 'trending',
        description: 'Python skills are trending in the job market',
        expiryDate: new Date('2024-12-31'),
        createdAt: serverTimestamp(),
      },
      {
        title: 'New Internship Opportunities Available',
        type: 'opportunity',
        description: 'Check out the latest internship openings',
        link: '/student/roles',
        expiryDate: new Date('2024-12-31'),
        createdAt: serverTimestamp(),
      },
    ]

    for (const announcement of announcements) {
      await addDoc(collection(db, 'announcements'), announcement)
    }

    // Seed Interview Questions
    console.log('Seeding interview questions...')
    const questions = [
      {
        field: 'Data Structures',
        question: 'Explain the difference between a stack and a queue.',
        difficulty: 'easy',
      },
      {
        field: 'Algorithms',
        question: 'What is the time complexity of binary search?',
        difficulty: 'medium',
      },
      {
        field: 'System Design',
        question: 'How would you design a URL shortener like bit.ly?',
        difficulty: 'hard',
      },
      {
        field: 'JavaScript',
        question: 'Explain closures in JavaScript with an example.',
        difficulty: 'medium',
      },
      {
        field: 'React',
        question: 'What is the difference between useState and useEffect?',
        difficulty: 'easy',
      },
      {
        field: 'Database',
        question: 'Explain ACID properties in database transactions.',
        difficulty: 'medium',
      },
    ]

    for (const question of questions) {
      await addDoc(collection(db, 'interview_questions'), question)
    }

    console.log('Seed data completed successfully!')
  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

seedData()
