import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp, query, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
let isFirstLoad = true; // 처음 접속 시 기존 메시지들에 대해 알림이 폭주하는 것 방지

// 로그인 함수
window.handleLogin = () => {
    const nameEl = document.getElementById('username');
    const pwEl = document.getElementById('password');
    if(!nameEl || !pwEl) return;

    const name = nameEl.value;
    const pw = pwEl.value;

    if (MEMBERS[name] && MEMBERS[name].pw === pw) {
        me = { name, ...MEMBERS[name] };
        
        // 알림 권한 요청 (백그라운드 알림의 핵심)
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") console.log("알림 권한 허용됨");
            });
        }

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

// 브라우저 알림 실행 함수
function triggerPushNotification(senderName, messageText) {
    // 내가 보낸 메시지거나 페이지가 완전히 활성화된 상태면 알림을 띄우지 않음 (선택 사항)
    if (senderName === me.name) return;

    if (Notification.permission === "granted") {
        const notification = new Notification(`ECCF 새 메시지: ${senderName}`, {
            body: messageText,
            icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968756.png' // 채팅 아이콘 예시
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// 메시지 실시간 수신 및 UI 출력
function listenMessages() {
    const container = document.getElementById('messages');
    if (!container) return;

    const chatRef = ref(db, 'chat_logs');
    
    onValue(chatRef, (snap) => {
        const dataList = [];
        snap.forEach((child) => {
            dataList.push(child.val());
        });

        // UI 렌더링
        container.innerHTML = '';
        dataList.forEach((data) => {
            const div = document.createElement('div');
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.marginBottom = "15px";
            
            const isMe = (data.name === me.name);
            const isOwner = (data.role === 'OWNER');
            const align = isMe ? 'flex-end' : 'flex-start';

            let typeClass = isMe ? 'msg-me' : (isOwner ? 'msg-owner' : 'msg-user');

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

        // 새 메시지 알림 로직
        if (!isFirstLoad && dataList.length > 0) {
            const lastMsg = dataList[dataList.length - 1];
            // 브라우저 탭이 백그라운드에 있거나 최소화되었을 때 알림 트리거
            if (document.hidden) {
                triggerPushNotification(lastMsg.name, lastMsg.text);
            }
        }
        
        isFirstLoad = false; // 첫 로딩 이후부터 알림 활성화
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
}
