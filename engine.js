import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. Firebase 설정 (방금 복사하신 본인 키를 여기에 넣으세요)
const firebaseConfig = {
    apiKey: "AIzaSyDBxVUD8yJKxmt7I1p4eQgUeLeEMvYv-yo",
    authDomain: "eccf-ee0be.firebaseapp.com",
    databaseURL: "https://eccf-ee0be-default-rtdb.firebaseio.com",
    projectId: "eccf-ee0be",
    storageBucket: "eccf-ee0be.appspot.com",
    messagingSenderId: "482426382572",
    appId: "1:482426382572:web:b39163083aff44416e5dc9",
    measurementId: "G-J9DXR8XK4C"
};

// 중복 선언 방지를 위해 이미 앱이 있는지 확인 후 초기화
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

// window.을 붙여야 HTML의 onclick에서 인식합니다!
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
    if (!input || !input.value.trim()) return;

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
            let typeClass = (data.name === me.name) ? 'msg-me' : (data.role === 'OWNER' ? 'msg-owner' : 'msg-user');

            div.innerHTML = `
                <div class="sender-name">${data.name}</div>
                <div class="msg-unit ${typeClass}">${data.text}</div>
            `;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
}
