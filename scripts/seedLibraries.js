const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } = require("firebase/firestore");

const firebaseConfig = {
   apiKey: "AIzaSyD06ajWHNF2c9eI31QVpnSTq3ZHw2_-lSg",
  authDomain: "campus-library-5ccb5.firebaseapp.com",
  projectId: "campus-library-5ccb5",
  storageBucket: "campus-library-5ccb5.firebasestorage.app",
  messagingSenderId: "457561001033",
  appId: "1:457561001033:web:e122a931f43bda682e8398",

};

const LIBRARIES = [
  { name: "Central Library", type: "central" },
  { name: "Accounting and Information Systems", type: "department", department: "Accounting and Information Systems", faculty: "Faculty of Business Studies" },
  { name: "Agricultural Economics", type: "department", department: "Agricultural Economics", faculty: "Faculty of Agriculture" },
  { name: "Agronomy and Agricultural Extension", type: "department", department: "Agronomy and Agricultural Extension", faculty: "Faculty of Agriculture" },
  { name: "Anthropology", type: "department", department: "Anthropology", faculty: "Faculty of Social Science" },
  { name: "Applied Chemistry and Chemical Engineering", type: "department", department: "Applied Chemistry and Chemical Engineering", faculty: "Faculty of Engineering" },
  { name: "Applied Mathematics", type: "department", department: "Applied Mathematics", faculty: "Faculty of Science" },
  { name: "Arabic", type: "department", department: "Arabic", faculty: "Faculty of Arts" },
  { name: "Bangla", type: "department", department: "Bangla", faculty: "Faculty of Arts" },
  { name: "Banking and Insurance", type: "department", department: "Banking and Insurance", faculty: "Faculty of Business Studies" },
  { name: "Biochemistry and Molecular Biology", type: "department", department: "Biochemistry and Molecular Biology", faculty: "Faculty of Science" },
  { name: "Botany", type: "department", department: "Botany", faculty: "Faculty of Life & Earth Science" },
  { name: "Chemistry", type: "department", department: "Chemistry", faculty: "Faculty of Science" },
  { name: "Computer Science and Engineering", type: "department", department: "Computer Science and Engineering", faculty: "Faculty of Engineering" },
  { name: "Crop Science and Technology", type: "department", department: "Crop Science and Technology", faculty: "Faculty of Agriculture" },
  { name: "Dairy and Poultry Science", type: "department", department: "Dairy and Poultry Science", faculty: "Faculty of Agriculture" },
  { name: "Development Studies", type: "department", department: "Development Studies", faculty: "Faculty of Social Science" },
  { name: "Economics", type: "department", department: "Economics", faculty: "Faculty of Social Science" },
  { name: "Electrical and Electronic Engineering", type: "department", department: "Electrical and Electronic Engineering", faculty: "Faculty of Engineering" },
  { name: "English", type: "department", department: "English", faculty: "Faculty of Arts" },
  { name: "Environmental Science", type: "department", department: "Environmental Science", faculty: "Faculty of Life & Earth Science" },
  { name: "Finance", type: "department", department: "Finance", faculty: "Faculty of Business Studies" },
  { name: "Fine Arts", type: "department", department: "Fine Arts", faculty: "Faculty of Fine Arts" },
  { name: "Fisheries", type: "department", department: "Fisheries", faculty: "Faculty of Agriculture" },
  { name: "Folklore", type: "department", department: "Folklore", faculty: "Faculty of Arts" },
  { name: "Genetic Engineering and Biotechnology", type: "department", department: "Genetic Engineering and Biotechnology", faculty: "Faculty of Life & Earth Science" },
  { name: "Geography and Environmental Studies", type: "department", department: "Geography and Environmental Studies", faculty: "Faculty of Life & Earth Science" },
  { name: "Geology and Mining", type: "department", department: "Geology and Mining", faculty: "Faculty of Life & Earth Science" },
  { name: "History", type: "department", department: "History", faculty: "Faculty of Arts" },
  { name: "Horticulture", type: "department", department: "Horticulture", faculty: "Faculty of Agriculture" },
  { name: "Industrial and Production Engineering", type: "department", department: "Industrial and Production Engineering", faculty: "Faculty of Engineering" },
  { name: "Information and Communication Engineering", type: "department", department: "Information and Communication Engineering", faculty: "Faculty of Engineering" },
  { name: "International Relations", type: "department", department: "International Relations", faculty: "Faculty of Social Science" },
  { name: "Islamic History and Culture", type: "department", department: "Islamic History and Culture", faculty: "Faculty of Arts" },
  { name: "Islamic Studies", type: "department", department: "Islamic Studies", faculty: "Faculty of Arts" },
  { name: "Journalism and Mass Communication", type: "department", department: "Journalism and Mass Communication", faculty: "Faculty of Social Science" },
  { name: "Law", type: "department", department: "Law", faculty: "Faculty of Law" },
  { name: "Management Studies", type: "department", department: "Management Studies", faculty: "Faculty of Business Studies" },
  { name: "Marketing", type: "department", department: "Marketing", faculty: "Faculty of Business Studies" },
  { name: "Materials Science and Engineering", type: "department", department: "Materials Science and Engineering", faculty: "Faculty of Engineering" },
  { name: "Mathematics", type: "department", department: "Mathematics", faculty: "Faculty of Science" },
  { name: "Music", type: "department", department: "Music", faculty: "Faculty of Fine Arts" },
  { name: "Pali and Buddhist Studies", type: "department", department: "Pali and Buddhist Studies", faculty: "Faculty of Arts" },
  { name: "Persian Language and Literature", type: "department", department: "Persian Language and Literature", faculty: "Faculty of Arts" },
  { name: "Pharmacy", type: "department", department: "Pharmacy", faculty: "Faculty of Pharmacy" },
  { name: "Philosophy", type: "department", department: "Philosophy", faculty: "Faculty of Arts" },
  { name: "Physical Education and Sports Science", type: "department", department: "Physical Education and Sports Science", faculty: "Faculty of Social Science" },
  { name: "Physics", type: "department", department: "Physics", faculty: "Faculty of Science" },
  { name: "Political Science", type: "department", department: "Political Science", faculty: "Faculty of Social Science" },
  { name: "Population Science and Human Resource Development", type: "department", department: "Population Science and Human Resource Development", faculty: "Faculty of Social Science" },
  { name: "Psychology", type: "department", department: "Psychology", faculty: "Faculty of Social Science" },
  { name: "Public Administration", type: "department", department: "Public Administration", faculty: "Faculty of Social Science" },
  { name: "Sanskrit", type: "department", department: "Sanskrit", faculty: "Faculty of Arts" },
  { name: "Social Work", type: "department", department: "Social Work", faculty: "Faculty of Social Science" },
  { name: "Sociology", type: "department", department: "Sociology", faculty: "Faculty of Social Science" },
  { name: "Statistics", type: "department", department: "Statistics", faculty: "Faculty of Science" },
  { name: "Theatre and Performance Studies", type: "department", department: "Theatre and Performance Studies", faculty: "Faculty of Fine Arts" },
  { name: "Urdu", type: "department", department: "Urdu", faculty: "Faculty of Arts" },
  { name: "Veterinary and Animal Science", type: "department", department: "Veterinary and Animal Science", faculty: "Faculty of Agriculture" },
  { name: "Zoology", type: "department", department: "Zoology", faculty: "Faculty of Life & Earth Science" },
];

async function reseed() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Deleting old libraries...");
  const existing = await getDocs(collection(db, "libraries"));
  for (const docSnap of existing.docs) {
    await deleteDoc(doc(db, "libraries", docSnap.id));
  }
  console.log(`Deleted ${existing.size} old entries.`);

  console.log(`Seeding ${LIBRARIES.length} libraries...`);
  for (const lib of LIBRARIES) {
    const ref = await addDoc(collection(db, "libraries"), lib);
    console.log(`✓ ${lib.name} → ${ref.id}`);
  }
  console.log(`Done! Total: ${LIBRARIES.length} libraries.`);
  process.exit(0);
}

reseed().catch((err) => {
  console.error(err);
  process.exit(1);
});