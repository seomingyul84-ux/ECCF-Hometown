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

// [핵심] Lichess 클라우드 엔진 API 호출 함수
window.startAIChess = async () => {
    const container = document.getElementById('chess-container');
    container.innerHTML = '<div id="board" style="width: 100%; aspect-ratio: 1/1; background: #dee2e6; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #495057;">API 연결 중...</div>';

    try {
        // Lichess Cloud Eval API 사용 (FEN을 보내면 Stockfish의 최선의 수를 알려줌)
        // 현재 보드 상황(FEN)을 보내면 엔진이 분석한 데이터를 가져옵니다.
        const currentFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${currentFEN}`);
        
        if (!response.ok) throw new Error("API 응답 없음");
        
        const data = await response.json();
        const bestMove = data.pvs[0].moves.split(' ')[0]; // 엔진이 추천하는 첫 번째 수

        container.innerHTML = `
            <div style="padding: 15px; text-align: center; background: white; border-radius: 8px;">
                <b style="color: #2563eb;">Lichess 엔진 연결 성공</b><br>
                <p style="font-size: 13px; margin-top: 10px;">현재 추천 수: <span style="color: #ef4444; font-weight: bold;">${bestMove}</span></p>
                <div style="font-size: 11px; color: #64748b;">(이 방식은 API로 데이터만 받아오므로<br>보드 UI 라이브러리가 추가로 필요합니다.)</div>
            </div>`;
            
    } catch (e) {
        console.error("엔진 호출 에러:", e);
        container.innerHTML = '<span style="color: #ef4444;">API 호출 실패 (네트워크 확인)</span>';
    }
};

// --- 아래는 기존 채팅 관련 코드 (동일함) ---

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
    } else { alert("정보가 올바르지 않습니다."); }
};

window.handleSend = () => {
    const input = document.getElementById('msg-input');
    if (!input || !input.value.trim() || !me) return;
    push(ref(db, 'chat_logs'), { name: me.name, role: me.role, text: input.value, time: serverTimestamp() });
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
                </div>`;
            container.appendChild(div);
            if (document.hidden && !isMe) { new Notification(`ECCF 새 메시지: ${data.name}`, { body: data.text }); }
        });
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
}
