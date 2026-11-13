# ส่งต่องานเกม TUEK.IO ให้ทีมเว็บไซต์

## ขอบเขต

โฟลเดอร์นี้รับผิดชอบเกมเท่านั้น: วาดฉาก, input, กติกา, คะแนน, เสียง, Game Over และ Restart ทีมเว็บไซต์รับผิดชอบ Login/Register, Profile, Leaderboard, Like/Love/Comment, Socket.IO, Express, ฐานข้อมูล และ deployment ไม่มีการสร้างหน้าเหล่านี้ในเกม

เกมไม่ระบุว่าผู้เล่นออนไลน์เป็นใคร เว็บไซต์ต้องผูกคะแนนกับผู้ใช้ที่ login ผ่าน session บน server โดยไม่เชื่อชื่อหรือ playerId จาก client

## วิธีที่แนะนำ: ใช้ React component

คัดลอก src/TuekGame.tsx, src/game.ts, src/audio.ts, src/style.css เข้าเว็บ แล้วติดตั้ง react, react-dom และ phaser ตาม package.json หรือ import จาก src/index.ts หากวางอยู่ใน repository เดียวกัน ไม่ต้องคัดลอก main.tsx, standalone.css, storage.ts, server.mjs หรือ data ซึ่งเป็นเครื่องมือทดลองในเครื่อง

```tsx
import { TuekGame, type GameResult } from './game'; // ปรับ path ไปที่ src/index.ts

async function saveScore(result: GameResult) {
  const response = await fetch('/api/game-runs', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  if (!response.ok) throw new Error('Score not saved');
}

export function GamePage() {
  return <div style={{ height: '100dvh' }}>
    <TuekGame
      saveResult={saveScore}
      onGameOver={result => console.log('รอบนี้จบแล้ว', result)}
    />
  </div>;
}
```

saveResult ต้อง return Promise ที่ resolve เมื่อ server ยืนยันการบันทึกสำเร็จ และ reject เมื่อผิดพลาด เกมจะมีปุ่มลองบันทึกอีกครั้งโดยใช้ id เดิม onGameOver เรียกครั้งเดียวเมื่อจบรอบ ไม่ใช่การยืนยันว่าบันทึกสำเร็จ ถ้าต้องอัปเดตส่วนอื่นหลังบันทึก ให้ทำใน saveResult หลังตรวจ response.ok

Component เต็มขนาด container ผู้เรียกต้องกำหนดความสูงให้ container เช่น 100dvh หรือ 700px CSS ของเกม scope อยู่ใน .tuek-game และไม่แก้ body ของเว็บไซต์ การ unmount ทำลาย canvas, input และ audio context

## สัญญาข้อมูลสำหรับ POST /api/game-runs ที่ทีมเว็บต้องทำ

```json
{
  "id": "693e3275-fcd6-4caf-9ec4-f1eef4bb03a6",
  "gameId": "tuek",
  "score": 350,
  "floors": 3,
  "perfectDrops": 1,
  "durationMs": 12500,
  "createdAt": "2026-11-13T12:00:00.000Z",
  "version": 1
}
```

Endpoint นี้เป็นข้อตกลงที่เสนอให้ทีมเว็บ ยังไม่ได้สร้าง API นี้ใน local demo (`/api/runs` เป็น API ทดลองอีกชุดหนึ่ง)

- id: UUID ของรอบเกม ใช้ unique constraint เพื่อให้ retry ไม่สร้างคะแนนซ้ำ
- gameId/version: ระบุเกมและเวอร์ชันข้อมูล
- score = floors * 100 + perfectDrops * 50; 0 <= perfectDrops <= floors
- durationMs: ระยะเวลารอบ หน่วย ms
- createdAt: เวลาฝั่งผู้เล่น ควรบันทึก receivedAt จาก server อีกช่อง
- user_id: server ดึงจาก session ของเว็บไซต์ ไม่รับจาก payload นี้

ตอบ 201 เมื่อสร้างสำเร็จ หรือ 200 เมื่อ id นี้เคยบันทึกแล้วโดยเป็นของผู้ใช้เดียวกัน หาก UUID เป็นของคนอื่นให้ปฏิเสธ ตอบ 400 สำหรับข้อมูลผิด 401 สำหรับยังไม่ login และ 500 สำหรับบันทึกไม่ได้

เสนอ table game_runs: id (unique), user_id (FK users), game_id, score, floors, perfect_drops, duration_ms, client_created_at, received_at. เลือกคะแนนสูงสุดต่อ user_id สำหรับ leaderboard และแจ้ง Socket.IO หลัง transaction บันทึกสำเร็จ ฝั่งเกมไม่จัดการ Socket.IO เอง

สูตรคะแนนอย่างเดียวป้องกันการปลอมคะแนนไม่ได้ ทีม backend ต้องตรวจ session, ขนาด request, ค่าจำนวนเต็ม/ขอบเขต และเพิ่มการตรวจผลเกมตามระดับที่งานต้องการ

## ทางเลือก: ฝัง standalone build

`npm run build` แล้วนำโฟลเดอร์ dist ทั้งชุดไปให้เว็บเสิร์ฟที่ /game/ จากนั้นใช้ `<iframe src="/game/" title="TUEK.IO" style="width:100%;height:700px;border:0"></iframe>`

วิธีนี้ main.tsx ยังส่ง POST /api/runs และใช้ Guest/playerId จาก demo ต้องเปลี่ยน adapter ใน main.tsx เป็น fetch /api/game-runs แบบตัวอย่าง React ด้านบนก่อนใช้งานกับสมาชิกจริง ไม่มีการส่งคะแนนผ่าน postMessage โดยอัตโนมัติ และอย่าแทรก secret หรือรหัสผ่านใน iframe URL

## การทดลองของเรา

npm install แล้ว npm run dev เปิด http://127.0.0.1:5173 เล่นจบรอบแล้ว local adapter จะส่งคะแนนไป server.mjs บันทึก data/scores.json ใช้ตรวจเกมแยกจากงานเว็บไซต์ได้ ยังไม่ใช่ MySQL หรือระบบสมาชิกออนไลน์ ประวัติ JSON เดิมยังคงอยู่

npm run build ตรวจ TypeScript และสร้าง dist; npm start เปิด build พร้อม API demo เกมมีเสียงหลัง interaction ครั้งแรกตามนโยบาย browser
