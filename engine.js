import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// ⚠️ 본인의 Firebase 설정값으로 반드시 교체하세요!
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBxVUD8yJKxmt7I1p4eQgUeLeEMvYv-yo",
  authDomain: "eccf-ee0be.firebaseapp.com",
  databaseURL: "https://eccf-ee0be-default-rtdb.firebaseio.com",
  projectId: "eccf-ee0be",
  storageBucket: "eccf-ee0be.firebasestorage.app",
  messagingSenderId: "482426382572",
  appId: "1:482426382572:web:b39163083aff44416e5dc9",
  measurementId: "G-J9DXR8XK4C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const MEMBERS = {
    "서민규": { pw: "35687482", role: "OWNER" },
    "김진성": { pw: "44154323", role: "USER" },
    "송호연": { pw: "83546291", role: "USER" },
    "이진우": { pw: "32753621", role: "USER" },
    "김준우": { pw: "91216332", role: "USER" }
};

let me = null;

window.handleLogin = () => {
    const name = document.getElementById('username').value;
    const pw = document.getElementById('password').value;

    if (MEMBERS[name] && MEMBERS[name].pw === pw) {
        me = { name, ...MEMBERS[name] };
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('chat-box').style.display = 'flex';
        document.getElementById('header-title').innerText = `접속중: ${name} (${me.role})`;
        listenMessages();
    } else {
        alert("정보가 올바르지 않습니다.");
    }
};

window.handleSend = () => {
    const input = document.getElementById('msg-input');
    if (!input.value.trim()) return;

    push(ref(db, 'chat_logs'), {
        name: me.name,
        role: me.role,
        text: input.value,
        time: serverTimestamp()
    });
    input.value = '';
};

function listenMessages() {
    const container = document.getElementById('messages');
    onValue(ref(db, 'chat_logs'), (snap) => {
        container.innerHTML = '';
        snap.forEach((child) => {
            const data = child.val();
            const div = document.createElement('div');
            
            // 본인, OWNER, 일반 유저 스타일에 따라 클래스 부여
            let typeClass = 'msg-user';
            if (data.name === me.name) typeClass = 'msg-me';
            else if (data.role === 'OWNER') typeClass = 'msg-owner';

            div.innerHTML = `
                <div class="sender-name">${data.name}</div>
                <div class="msg-unit ${typeClass}">${data.text}</div>
            `;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
}
