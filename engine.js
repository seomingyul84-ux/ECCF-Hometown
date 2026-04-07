import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. Firebase 설정
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

// 초기화
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

// 2. 로그인 함수 (window 객체에 등록해야 HTML에서 호출 가능)
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

// 3. 메시지 전송 함수
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

// 4. 메시지 수신 로직
function listenMessages() {
    const container = document.getElementById('messages');
    onValue(ref(db, 'chat_logs'), (snap) => {
        container.innerHTML = '';
        snap.forEach((child) => {
            const data = child.val();
            const div = document.createElement('div');
            
            let typeClass = 'msg-user';
            if (data.name === me.name) typeClass = 'msg-me';
            else if (data.role === 'OWNER') typeClass = 'msg-owner';

            div.style.marginBottom = "10px";
            div.innerHTML = `
                <div style="font-size: 11px; color: #666;">${data.name}</div>
                <div class="msg-unit ${typeClass}" style="display:inline-block; padding:8px; border-radius:10px;">${data.text}</div>
            `;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
}
