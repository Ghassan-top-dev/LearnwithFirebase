import { 
    collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, 
    deleteDoc, doc, setDoc, increment 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { auth, db } from '../firebaseConfig.js';

const noteInput = document.getElementById('noteInput');
const addNoteButton = document.getElementById('addNote');
const notesList = document.getElementById('notesList');

// Helper function to get sanitized collection name
function getCollectionName(email) {
    return `notes_${email.replace(/[.@]/g, '_')}`;
}

// Add note to Firestore and update contributions
async function addNote() {
    if (!noteInput.value.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
        // Add note to Firestore
        const userCollection = collection(db, getCollectionName(user.email));
        await addDoc(userCollection, {
            content: noteInput.value,
            createdAt: serverTimestamp()
        });

        // Update contribution count in Firestore
        const contributionsRef = doc(db, "contributions", user.uid);
        await setDoc(contributionsRef, { count: increment(1) }, { merge: true });

        // Update local storage for the contribution grid
        const today = new Date().toISOString().split('T')[0];
        let contributions = JSON.parse(localStorage.getItem('contributions')) || {};
        contributions[today] = (contributions[today] || 0) + 1;
        localStorage.setItem('contributions', JSON.stringify(contributions));

        // Dispatch a storage event to notify other tabs/windows
        window.dispatchEvent(new Event('storage'));

        // Clear note input
        noteInput.value = '';

        console.log("Note added and contribution updated");
    } catch (error) {
        console.error("Error adding note:", error);
    }
}

// Delete note from Firestore
async function deleteNote(docId) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        const userCollection = getCollectionName(user.email);
        await deleteDoc(doc(db, userCollection, docId));
    } catch (error) {
        console.error("Error deleting note:", error);
    }
}

// Display notes in real-time
function setupNotesListener() {
    const user = auth.currentUser;
    if (!user) return;

    const userCollection = collection(db, getCollectionName(user.email));
    const notesQuery = query(userCollection, orderBy('createdAt', 'desc'));

    onSnapshot(notesQuery, (snapshot) => {
        notesList.innerHTML = '';
        snapshot.forEach((doc) => {
            const note = doc.data();

            // Create note element
            const noteElement = document.createElement('div');
            noteElement.className = 'note-element';

            // Create content element
            const contentElement = document.createElement('div');
            contentElement.className = 'note-content';
            contentElement.textContent = note.content;

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.textContent = '🗑️';
            deleteButton.onclick = () => deleteNote(doc.id);

            // Append elements
            noteElement.appendChild(contentElement);
            noteElement.appendChild(deleteButton);
            notesList.appendChild(noteElement);
        });
    });
}

// Add note event listener
addNoteButton.addEventListener('click', addNote);

// Only display notes if user is logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        setupNotesListener();
    } else {
        notesList.innerHTML = '';
    }
});
