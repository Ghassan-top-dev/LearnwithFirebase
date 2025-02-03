import { 
    getFirestore, collection, addDoc, serverTimestamp, 
    doc, getDoc, setDoc, increment, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { db } from "../firebaseConfig.js";

const auth = getAuth();
const noteInput = document.getElementById('noteInput');
const addNoteButton = document.getElementById('addNote');
const notesList = document.getElementById('notesList'); // Make sure this exists in index.html

// Function to add a note
async function addNote() {
    if (!noteInput.value.trim()) return;

    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    try {
        // Add note to Firestore
        const userCollection = collection(db, "notes", user.uid, "userNotes");
        await addDoc(userCollection, {
            content: noteInput.value,
            createdAt: serverTimestamp()
        });

        // Update contribution count in Firestore
        const contributionsRef = doc(db, "contributions", user.uid);
        await setDoc(contributionsRef, { count: increment(1) }, { merge: true });

        // Update local storage for the grid
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        let contributions = JSON.parse(localStorage.getItem('contributions')) || {};
        contributions[dateString] = (contributions[dateString] || 0) + 1;
        localStorage.setItem('contributions', JSON.stringify(contributions));

        noteInput.value = ""; // Clear input field
        console.log("Note added and contribution updated");

        localStorage.setItem('contributions', JSON.stringify(contributions));
        window.dispatchEvent(new Event('storage'));

    } catch (error) {
        console.error("Error adding note:", error);
    }
}

// Function to display notes in the UI
function displayNotes(notes) {
    notesList.innerHTML = ""; // Clear existing notes

    notes.forEach(note => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.textContent = note.content;
        notesList.appendChild(noteElement);
    });
}

// Function to fetch and display notes in real-time
function fetchNotes() {
    const user = auth.currentUser;
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const userCollection = collection(db, "notes", user.uid, "userNotes");
    const notesQuery = query(userCollection, orderBy("createdAt", "desc"));

    onSnapshot(notesQuery, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayNotes(notes);
    });
}

// Attach event listener
addNoteButton.addEventListener("click", addNote);

// Listen for auth state changes and fetch notes when user logs in
auth.onAuthStateChanged(user => {
    if (user) {
        fetchNotes();
    } else {
        notesList.innerHTML = "<p>Please log in to view notes.</p>";
    }
});