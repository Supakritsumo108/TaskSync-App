# 🎨 Design System & Documentation: TaskSync

**TaskSpace** คือ Web Application สำหรับจัดการงานและติดตามประสิทธิภาพการทำงานส่วนบุคคล ออกแบบด้วยแนวคิด Modern, Clean และ User-Friendly โดยเน้นไปที่การดูภาพรวมได้รวดเร็วและการจัดการงานที่ลื่นไหล

---

## 📌 1. Core Concept & UX/UI

- **Minimalist & Clean:** ใช้พื้นหลังสีสว่าง (Off-white/Slate-50) ตัดกับ Card สีขาวเพื่อให้ข้อมูลดูโดดเด่นและอ่านง่าย ไม่อึดอัด
- **Visual Hierarchy:** เน้นความสำคัญของข้อมูลด้วยขนาดตัวอักษรและน้ำหนัก (Font Weight) เช่น ชื่องาน ตัวเลขสถิติ
- **Color Coded:** ใช้สีในการสื่อความหมายของสถานะงานและระดับความสำคัญ เพื่อให้ผู้ใช้กวาดตามองและเข้าใจได้ทันที (Glanceability)

---

## 🎨 2. Color Palette (อ้างอิงจาก Tailwind CSS)

| การใช้งาน        | สี (Tailwind Class)      | โค้ดสี (Hex)         | ความหมาย / บริบท                       |
| :--------------- | :----------------------- | :------------------- | :------------------------------------- |
| **Primary**      | `indigo-600`             | `#4F46E5`            | ปุ่มหลัก, ข้อความต้อนรับ, Hover States |
| **Background**   | `slate-50`               | `#F8FAFC`            | พื้นหลังของแอปพลิเคชันโดยรวม           |
| **Surface**      | `white`                  | `#FFFFFF`            | พื้นหลังของ Card, Modal, Table         |
| **Text (Dark)**  | `slate-800`, `slate-900` | `#1E293B`, `#0F172A` | หัวข้อหลัก, ข้อความสำคัญ               |
| **Text (Muted)** | `slate-500`              | `#64748B`            | คำอธิบายเพิ่มเติม, Placeholder         |
| **Success**      | `emerald-500`            | `#10B981`            | สถานะ Completed                        |
| **Warning**      | `amber-500`              | `#F59E0B`            | สถานะ In Progress, Medium Priority     |
| **Danger**       | `red-500`                | `#EF4444`            | High Priority, ปุ่มออกจากระบบ          |

---

## 📱 3. Key Views & Layouts

### 3.1 Authentication Screen (Login / Sign Up)

- **Layout:** Centered Card แบบ Single Column
- **Features:** \* สลับหน้า Login และ Sign Up ได้อย่างไร้รอยต่อ
  - รองรับการเข้าระบบผ่าน Email / Password
  - ปุ่ม "เข้าสู่ระบบด้วย Google" (Social Login) พร้อมไอคอนแบรนด์
- **Animation:** Fade-in และ Zoom-in เบาๆ เมื่อโหลดหน้าเว็บเพื่อความนุ่มนวล

### 3.2 Dashboard & Workspace (Main Screen)

- **Header:** แสดงชื่อระบบต้อนรับ (Email ผู้ใช้) และปุ่ม Logout จัดวางไว้กึ่งกลางหน้าจอ
- **Overview Card (Pie Chart):**
  - กราฟวงกลมแสดงสัดส่วนงาน (Completed, In Progress, To-Do)
  - แสดงตัวเลข "งานทั้งหมด" ไว้ตรงกลางกราฟ
- **Task Controls:**
  - ช่องค้นหา (Search) ค้นหาจากชื่องาน
  - Dropdown กรองสถานะ (Status)
  - Dropdown กรองความสำคัญ (Priority)
  - ปุ่ม `+ New Task` โดดเด่นด้วยสี Primary
- **Task Table:** \* จัดเรียงข้อมูลเป็นคอลัมน์ (ชื่องาน, ผู้รับผิดชอบ, สถานะ, ความสำคัญ)
  - Hover Effect: เมื่อเอาเมาส์ชี้ แถวจะเปลี่ยนสีเป็น `indigo-50` เพื่อบอกว่ากดดูรายละเอียดได้

### 3.3 Modals (Overlay Windows)

- **พื้นหลัง (Backdrop):** สีดำโปร่งแสง `slate-900/60` พร้อมเอฟเฟกต์ Blur
- **Task Details Modal:** แสดงข้อมูลงานแบบเจาะลึก พร้อม Badge สีตามระดับความสำคัญ
- **Add Task Modal:** ฟอร์ม 2 คอลัมน์ (Grid) เพื่อประหยัดพื้นที่แนวตั้ง ประกอบด้วย Input แบบ Text, Date, Select และ Textarea

---

## 🛠 4. Technology Stack & State Management

- **Framework:** React.js (Functional Components + Hooks)
- **Styling:** Tailwind CSS (Utility-first CSS)
- **State Management (`useState`):**
  - `isLoggedIn`, `isSignUpView`: จัดการสถานะการเข้าสู่ระบบ
  - `tasks`: จัดเก็บข้อมูลรายการงานทั้งหมด (Array of Objects)
  - `searchTerm`, `statusFilter`, `priorityFilter`: จัดการเงื่อนไขการค้นหา
  - `isAddingTask`, `selectedTask`: จัดการการเปิด/ปิด Modal

---

## 🚀 5. Future Enhancements (ไอเดียพัฒนาต่อยอด)

1. **เชื่อมต่อ Backend/Database:** นำ Firebase, Supabase หรือ MongoDB มาใช้จัดเก็บงานและระบบ Login จริง
2. **ระบบ Drag & Drop (Kanban Board):** เพิ่มมุมมองแบบบอร์ด เพื่อลากงานเปลี่ยนสถานะได้ (เช่น Trello)
3. **Dark Mode:** เพิ่มสวิตช์เปิด/ปิด โหมดกลางคืน (ปรับแก้สี Slate เป็นหลัก)
4. **Responsive Design:** ปรับแต่งตาราง (Table) ให้กลายเป็น Card แบบซ้อนกันเมื่อดูบนหน้าจอมือถือขนาดเล็ก
