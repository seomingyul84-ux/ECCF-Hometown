import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// 1. Firebase 설정 (Firebase 콘솔에서 받은 본인의 키로 교체하세요)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. 회원 데이터
const MEMBER_LIST = {
    "서민규": { pw: "35687482", role: "OWNER" },
    "김진성": { pw: "44154323", role: "USER" },
    "송호연": { pw: "83546291", role: "USER" },
    "이진우": { pw: "32753621", role: "USER" },
    "김준우": { pw: "91216332", role: "USER" }
};

let currentUser = null;

// 3. 로그인 함수
window.login = function() {
    const id = document.getElementById('username').value;
    const pw = document.getElementById('password').value;

    if (MEMBER_LIST[id] && MEMBER_LIST[id].pw === pw) {
        currentUser = { id, ...MEMBER_LIST[id] };
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'flex';
        document.getElementById('user-info').innerText = `${id} (${currentUser.role})`;
        loadMessages();
    } else {
        alert("아이디 또는 비밀번호가 틀렸습니다.");
    }
};

// 4. 메시지 전송
window.send = function() {
    const input = document.getElementById('msg-input');
    if (!input.value.trim() || !currentUser) return;

    push(ref(db, 'messages'), {
        sender: currentUser.id,
        role: currentUser.role,
        text: input.value,
        timestamp: serverTimestamp()
    });
    input.value = '';
};

// 5. 메시지 실시간 수신
function loadMessages() {
    const msgDiv = document.getElementById('messages');
    onValue(ref(db, 'messages'), (snapshot) => {
        msgDiv.innerHTML = ''; // 초기화
        snapshot.forEach((child) => {
            const data = child.val();
            const item = document.createElement('div');
            item.className = 'msg';
            if (data.role === 'OWNER') item.classList.add('owner');
            
            item.innerText = `${data.sender}: ${data.text}`;
            msgDiv.appendChild(item);
        });
        msgDiv.scrollTop = msgDiv.scrollHeight; // 자동 스크롤
    });
}
