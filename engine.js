import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// 로그인 함수
window.handleLogin = () => {
    const nameEl = document.getElementById('username');
    const pwEl = document.getElementById('password');
    if(!nameEl || !pwEl) return;

    const name = nameEl.value;
    const pw = pwEl.value;

    if (MEMBERS[name] && MEMBERS[name].pw === pw) {
        me = { name, ...MEMBERS[name] };
        
        // 에러 방지를 위한 안전한 UI 전환
        const loginBox = document.getElementById('login-box');
        const chatBox = document.getElementById('chat-box');
        const userInfo = document.getElementById('user-info');

        if (loginBox) loginBox.style.display = 'none';
        if (chatBox) chatBox.style.display = 'flex';
        if (userInfo) userInfo.innerText = `${name} (${me.role})`;
        
        listenMessages();
    } else {
        alert("정보가 올바르지 않습니다.");
    }
};

// 메시지 전송 함수
window.handleSend = () => {
    const input = document.getElementById('msg-input');
    if (!input || !input.value.trim() || !me) return;

    push(ref(db, 'chat_logs'), {
        name: me.name,
        role: me.role,
        text: input.value,
        time: serverTimestamp()
    });
    input.value = '';
};

// 메시지 실시간 수신 및 UI 출력
function listenMessages() {
    const container = document.getElementById('messages');
    if (!container) return;

    onValue(ref(db, 'chat_logs'), (snap) => {
        container.innerHTML = '';
        snap.forEach((child) => {
            const data = child.val();
            const div = document.createElement('div');
            
            // 레이아웃 설정
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.marginBottom = "15px"; // 메시지 간 간격 넓힘
            
            // 작성자 구분에 따른 정렬 및 스타일
            const isMe = (data.name === me.name);
            const isOwner = (data.role === 'OWNER');
            
            let typeClass = 'msg-user';
            if (isMe) typeClass = 'msg-me';
            else if (isOwner) typeClass = 'msg-owner';

            // 정렬 방향 결정
            const align = isMe ? 'flex-end' : 'flex-start';

            div.innerHTML = `
                <div style="font-size: 12px; color: #6b7280; margin: 0 8px 4px 8px; align-self: ${align}">
                    ${data.name} ${isOwner ? '<span style="color:#ef4444; font-size:10px;">★</span>' : ''}
                </div>
                <div class="msg-unit ${typeClass}" style="align-self: ${align}; word-break: break-all;">
                    ${data.text}
                </div>
            `;
            container.appendChild(div);
        });
        
        // 부드럽게 아래로 스크롤
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
}
