import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { auth, db } from '../firebaseConfig.js';

const noteInput = document.getElementById('noteInput');
const addNoteButton = document.getElementById('addNote');
const notesList = document.getElementById('notesList');

// 1. Helper function to get sanitized collection name
function getCollectionName(email) {
    // Input email: user@example.com
    // After replacement: notes_user_example_com
    return `notes_${email.replace(/[.@]/g, '_')}`;
}

// Add note to Firestore
async function addNote() {
    // 2. Check if note input is empty 
    if(!noteInput.value.trim()) return; 

    // Add note to Firestore
    try {
        // 3. Get current user object
        const user = auth.currentUser; 
        if(!user) return; 

        // 4a. Get user collection object

        const userCollection = collection(db, getCollectionName(user.email)); 
        // 4b. Add note to Firestore

        await addDoc(userCollection, {

            content: noteInput.value,
            createdAt: serverTimestamp()
        });
        
        // 4c. Clear note input
        noteInput.value = ''; 

    } catch (error) {
        console.error("Error adding note: ", error);
    }
}

// Given because the logic closely resembles the code above
// Delete note from Firestore
async function deleteNote(docId) {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const userCollection = getCollectionName(user.email);
        await deleteDoc(doc(db, userCollection, docId));
    } catch (error) {
        console.error("Error deleting note: ", error);
    }
}

// 5. Display notes in real-time
function setupNotesListener() {
    // 5a. Get current user object
    const user = auth.currentUser; 
    if (!user) return;

    const userCollection = collection(db, getCollectionName(user.email)); 

    // 6a. Get user collection object

    // 6b. Get notes query object
    const notesQuery = query(
        userCollection, 
        orderBy('createdAt', 'desc')
    )
    

    // Listen to notes query object in real-time
    onSnapshot(notesQuery, (snapshot) => {
        // Clear notes list 
        notesList.innerHTML = '';
        // Loop through notes and display them
        snapshot.forEach((doc) => {
            // Get note object
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
