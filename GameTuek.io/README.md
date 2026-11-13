# TUEK.IO — Game module

เกมต่อตึก React + TypeScript + Phaser เท่านั้น พร้อมเสียงและระบบส่งผลรอบให้เว็บไซต์เจ้าของเกม ไม่มีหน้า Login, Profile, Leaderboard หรือ Chat ในโฟลเดอร์นี้

## ทดลองเล่น

```sh
npm install
npm run dev
```

เปิด http://127.0.0.1:5173 คลิก/แตะ/Space เพื่อปล่อยบล็อก วางปกติ 100 คะแนน Perfect 150 คะแนน วางเหลื่อมจะเสียความกว้าง หากไม่ทับตึกเลยจบรอบ

`npm run build` ตรวจ TypeScript และสร้าง dist แล้ว `npm start` ให้บริการ build พร้อม API ทดลอง (กำหนด PORT ได้)

## ส่งให้ทีมเว็บ

อ่าน INTEGRATION.md สำหรับ React component, ตัวอย่างเชื่อม API, รูปแบบข้อมูล และความรับผิดชอบของ backend ใช้ src/index.ts เป็น entry point และส่ง saveResult callback ให้ TuekGame

src/main.tsx และ server.mjs เป็น standalone demo ใช้ทดสอบเกมในเครื่องเท่านั้น บันทึกคะแนนใน data/scores.json ผ่าน POST /api/runs; GET /api/runs อ่านผลทั้งหมด ข้อมูลเก่าไม่ถูกลบ การเล่น demo ใช้ Guest และ playerId ใน localStorage ไม่มีระบบสมาชิกจริง

JSON store เขียนเรียงคิวและใช้ไฟล์ชั่วคราวก่อน rename รองรับเซิร์ฟเวอร์หนึ่ง process ต้องใช้พื้นที่เก็บถาวรเมื่อโฮสต์ API demo ยังไม่ใช่ระบบสำหรับการแข่งขันออนไลน์ ทีมเว็บไซต์รับผิดชอบ Express, session, MySQL, การตรวจคะแนน, Socket.IO และ Leaderboard
