// scripts/seedBooks.js
// Run: node scripts/seedBooks.js
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyD06ajWHNF2c9eI31QVpnSTq3ZHw2_-lSg",
  authDomain: "campus-library-5ccb5.firebaseapp.com",
  projectId: "campus-library-5ccb5",
  storageBucket: "campus-library-5ccb5.firebasestorage.app",
  messagingSenderId: "457561001033",
  appId: "1:457561001033:web:e122a931f43bda682e8398",

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getLibraryId(name) {
  const snap = await getDocs(collection(db, "libraries"));
  const lib = snap.docs.find((d) => d.data().name === name);
  return lib ? lib.id : null;
}

async function seed() {
  // Get library IDs
  const cseId = await getLibraryId("Computer Science and Engineering");
  const centralId = await getLibraryId("Central Library");
  const eeeId = await getLibraryId("Electrical and Electronic Engineering");
  const mathId = await getLibraryId("Mathematics");
  const engId = await getLibraryId("English");

  const BOOKS = [
    // CSE Library — 3 books
    {
      title: "Database System Concepts",
      author: "Abraham Silberschatz",
      type: "book",
      description: "A comprehensive introduction to database systems covering relational model, SQL, storage, indexing, and transaction management.",
      tags: ["database", "sql", "dbms", "3rd year"],
      shelfLocation: "Rack A-1",
      totalCopies: 5,
      availableCopies: 5,
      libraryId: cseId,
      libraryName: "Computer Science and Engineering",
      createdAt: Date.now(),
    },
    {
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      type: "book",
      description: "The classic textbook on algorithms covering sorting, searching, graph algorithms, dynamic programming, and NP-completeness.",
      tags: ["algorithms", "data structures", "2nd year", "competitive"],
      shelfLocation: "Rack A-2",
      totalCopies: 4,
      availableCopies: 4,
      libraryId: cseId,
      libraryName: "Computer Science and Engineering",
      createdAt: Date.now(),
    },
    {
      title: "Computer Networks",
      author: "Andrew S. Tanenbaum",
      type: "book",
      description: "Covers all layers of the network model — physical, data link, network, transport, and application layers.",
      tags: ["networking", "tcp/ip", "protocols", "3rd year"],
      shelfLocation: "Rack B-1",
      totalCopies: 3,
      availableCopies: 3,
      libraryId: cseId,
      libraryName: "Computer Science and Engineering",
      createdAt: Date.now(),
    },
    {
      title: "Machine Learning: A Probabilistic Perspective",
      author: "Kevin P. Murphy",
      type: "paper",
      description: "Research paper covering probabilistic models and inference methods in modern machine learning.",
      tags: ["machine learning", "ai", "probability", "4th year"],
      shelfLocation: "Rack C-1",
      totalCopies: 2,
      availableCopies: 2,
      libraryId: cseId,
      libraryName: "Computer Science and Engineering",
      createdAt: Date.now(),
    },

    // Central Library — 3 books (same title available in multiple libraries)
    {
      title: "Database System Concepts",
      author: "Abraham Silberschatz",
      type: "book",
      description: "A comprehensive introduction to database systems covering relational model, SQL, storage, indexing, and transaction management.",
      tags: ["database", "sql", "dbms"],
      shelfLocation: "Floor 2, Rack D-5",
      totalCopies: 8,
      availableCopies: 8,
      libraryId: centralId,
      libraryName: "Central Library",
      createdAt: Date.now(),
    },
    {
      title: "Operating System Concepts",
      author: "Abraham Silberschatz",
      type: "book",
      description: "Covers OS fundamentals including processes, threads, scheduling, memory management, file systems, and I/O.",
      tags: ["operating system", "os", "processes", "memory"],
      shelfLocation: "Floor 2, Rack D-6",
      totalCopies: 6,
      availableCopies: 6,
      libraryId: centralId,
      libraryName: "Central Library",
      createdAt: Date.now(),
    },
    {
      title: "Artificial Intelligence: A Modern Approach",
      author: "Stuart Russell",
      type: "book",
      description: "The leading textbook in AI, covering search, knowledge representation, planning, machine learning, and robotics.",
      tags: ["artificial intelligence", "ai", "machine learning"],
      shelfLocation: "Floor 3, Rack E-1",
      totalCopies: 4,
      availableCopies: 4,
      libraryId: centralId,
      libraryName: "Central Library",
      createdAt: Date.now(),
    },

    // EEE Library — 2 books
    {
      title: "Electric Circuits",
      author: "James W. Nilsson",
      type: "book",
      description: "Fundamental concepts of circuit analysis including Ohm's Law, Kirchhoff's Laws, AC/DC circuits, and Laplace transforms.",
      tags: ["circuits", "electronics", "1st year", "fundamentals"],
      shelfLocation: "Rack A-1",
      totalCopies: 5,
      availableCopies: 5,
      libraryId: eeeId,
      libraryName: "Electrical and Electronic Engineering",
      createdAt: Date.now(),
    },
    {
      title: "Signals and Systems",
      author: "Alan V. Oppenheim",
      type: "book",
      description: "Continuous and discrete time signals, Fourier analysis, Laplace transforms, and Z-transforms.",
      tags: ["signals", "systems", "fourier", "2nd year"],
      shelfLocation: "Rack B-2",
      totalCopies: 3,
      availableCopies: 3,
      libraryId: eeeId,
      libraryName: "Electrical and Electronic Engineering",
      createdAt: Date.now(),
    },

    // Math Library — 2 books
    {
      title: "Calculus: Early Transcendentals",
      author: "James Stewart",
      type: "book",
      description: "Complete calculus course covering limits, derivatives, integrals, sequences, series, and multivariable calculus.",
      tags: ["calculus", "mathematics", "1st year", "fundamentals"],
      shelfLocation: "Rack A-1",
      totalCopies: 7,
      availableCopies: 7,
      libraryId: mathId,
      libraryName: "Mathematics",
      createdAt: Date.now(),
    },
    {
      title: "Linear Algebra and Its Applications",
      author: "Gilbert Strang",
      type: "book",
      description: "Covers vectors, matrix operations, determinants, eigenvalues, and applications in engineering and science.",
      tags: ["linear algebra", "matrix", "mathematics", "2nd year"],
      shelfLocation: "Rack B-1",
      totalCopies: 4,
      availableCopies: 4,
      libraryId: mathId,
      libraryName: "Mathematics",
      createdAt: Date.now(),
    },

    // English Library — 2 books
    {
      title: "English Grammar in Use",
      author: "Raymond Murphy",
      type: "book",
      description: "A self-study reference and practice book for intermediate learners of English.",
      tags: ["grammar", "english", "language", "reference"],
      shelfLocation: "Rack A-1",
      totalCopies: 6,
      availableCopies: 6,
      libraryId: engId,
      libraryName: "English",
      createdAt: Date.now(),
    },
    {
      title: "The Elements of Style",
      author: "William Strunk Jr.",
      type: "book",
      description: "A prescriptive American English writing style guide covering composition, elementary rules, and commonly misused words.",
      tags: ["writing", "style", "english", "composition"],
      shelfLocation: "Rack A-2",
      totalCopies: 4,
      availableCopies: 4,
      libraryId: engId,
      libraryName: "English",
      createdAt: Date.now(),
    },
  ];

  // Remove null library IDs (if library not found)
  const validBooks = BOOKS.filter(
    (b) => b.libraryId !== null && b.libraryId !== undefined
  );

  console.log(`Seeding ${validBooks.length} books...`);
  for (const book of validBooks) {
    const ref = await addDoc(collection(db, "books"), book);
    console.log(`✓ "${book.title}" → ${book.libraryName} [${ref.id}]`);
  }
  console.log("\nDone! Books seeded successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});