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
let board = null;
let game = new Chess();

// [Lichess API 연동] Stockfish의 수 가져오기
async function makeAIMove() {
    const fen = game.fen();
    try {
        const response = await fetch(`https://lichess.org/api/cloud-eval?fen=${fen}`);
        const data = await response.json();
        
        if (data && data.pvs && data.pvs[0]) {
            const bestMove = data.pvs[0].moves.split(' ')[0]; // 예: "e7e5"
            game.move(bestMove, { sloppy: true });
            board.position(game.fen());
            checkGameOver();
        }
    } catch (e) {
        console.error("Lichess API 연동 실패:", e);
    }
}

function checkGameOver() {
    if (game.game_over()) {
        alert("게임 종료!");
    }
}

// [체스 보드 초기화 및 시작]
window.startAIChess = () => {
    game = new Chess();
    
    const onDrop = (source, target) => {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // 폰이 끝까지 가면 퀸으로 승단
        });

        if (move === null) return 'snapback';

        // 유저가 백(White)으로 수를 둔 후 AI 차례
        window.setTimeout(makeAIMove, 500);
    };

    const config = {
        draggable: true,
        position: 'start',
        orientation: 'white',
        onDrop: onDrop
    };

    board = Chessboard('myBoard', config);
    console.log("로컬 보드 & Lichess API 준비 완료");
};

// [채팅 관련 로직]
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
