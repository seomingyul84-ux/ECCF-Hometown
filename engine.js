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

// [해결책] 외부 사이트 로딩 대신, 차단 걱정 없는 오픈소스 체스 위젯 사용
window.startAIChess = () => {
    const container = document.getElementById('chess-container');
    if (!container) return;

    // 외부 사이트가 아닌, 임베드를 허용하는 전용 체스 게임 서버 주소입니다.
    // 만약 이것도 막힌다면, 자체 제작 보드로 전환해야 합니다.
    container.innerHTML = `
        <iframe src="https://lichess.org/training/frame?theme=brown&pieceSet=cburnett" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                style="border-radius: 8px; background: white;">
        </iframe>`;
    
    console.log("체스 대국 연습 모드 로드");
};

function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

window.handleLogin = () => {
    const nameEl = document.getElementById('username');
    const pwEl = document.getElementById('password');
    if(!nameEl || !pwEl) return;

    const name = nameEl.value;
    const pw = pwEl.value;

    if (MEMBERS[name] && MEMBERS[name].pw === pw) {
        me = { name, ...MEMBERS[name] };
        if (Notification.permission !== "granted") Notification.requestPermission();

        document.getElementById('login-box').style.display = 'none';
        document.getElementById('chat-box').style.display = 'flex';
        document.getElementById('user-info').innerText = `${name} (${me.role})`;
        
        listenMessages();
    } else {
        alert("정보가 올바르지 않습니다.");
    }
};

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

function listenMessages() {
    const container = document.getElementById('messages');
    if (!container) return;

    onValue(ref(db, 'chat_logs'), (snap) => {
        container.innerHTML = '';
        snap.forEach((child) => {
            const data = child.val();
            const div = document.createElement('div');
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.marginBottom = "15px";
            
            const isMe = (data.name === me.name);
            const isOwner = (data.role === 'OWNER');
            const align = isMe ? 'flex-end' : 'flex-start';
            const timeStr = formatTime(data.time);

            let typeClass = isMe ? 'msg-me' : (isOwner ? 'msg-owner' : 'msg-user');

            div.innerHTML = `
                <div style="font-size: 11px; color: #6b7280; margin: 0 8px 4px 8px; align-self: ${align}">${data.name} ${isOwner ? '★' : ''}</div>
                <div style="display: flex; align-items: flex-end; gap: 5px; flex-direction: ${isMe ? 'row-reverse' : 'row'}; align-self: ${align}">
                    <div class="msg-unit ${typeClass}" style="word-break: break-all;">${data.text}</div>
                    <span style="font-size: 10px; color: #9ca3af; white-space: nowrap; margin-bottom: 2px;">${timeStr}</span>
                </div>
            `;
            container.appendChild(div);

            if (document.hidden && !isMe) {
                new Notification(`ECCF 새 메시지: ${data.name}`, { body: data.text });
            }
        });
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
}
