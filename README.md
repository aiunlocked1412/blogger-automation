# Blogger Automation

ระบบโพสบทความลง Google Blogger อัตโนมัติ สร้างเนื้อหาด้วย AI (Google Gemini), ใส่รูปภาพ, ตั้งเวลาโพส, โพสทีละเยอะ ทั้งหมดผ่านหน้าเว็บ Dark Mode สวยๆ

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## ความสามารถ

- **สร้างบทความด้วย AI** - สร้างบทความยาว SEO ดี ด้วย Google Gemini 2.5 Flash Lite
- **ตรวจ SEO อัตโนมัติ** - วิเคราะห์คะแนน SEO แบบ real-time (title, meta, keywords, headings, จำนวนคำ)
- **ใส่รูปภาพอัตโนมัติ** - ดึงรูปจาก Unsplash/Pexels แล้วแทรกในบทความให้เลย
- **แทรก Backlink** - ใส่ลิงก์ money site ในบทความแบบธรรมชาติ ฝังในคีย์เวิร์ดที่เกี่ยวข้อง
- **โพสทีละเยอะ (Bulk)** - สร้างหลายบทความ + ตั้งเวลาโพสห่างกันตามที่กำหนด
- **โพสหลายบล็อก (Multi-Blog)** - สร้างบทความไม่ซ้ำกัน โพสไปหลายบล็อกพร้อมกัน
- **ตั้งเวลาโพส** - กำหนดวันเวลาที่จะเผยแพร่ในอนาคต
- **หน้าเว็บสวยๆ** - Dark theme แบบ Glassmorphism พร้อม animation
- **รองรับภาษาไทย** - สร้างบทความภาษาไทยได้เต็มรูปแบบ

## สิ่งที่ต้องเตรียมก่อนใช้งาน

1. **Node.js 18 ขึ้นไป** - [ดาวน์โหลด](https://nodejs.org/)
2. **Google Cloud Project** ที่เปิดใช้ Blogger API v3 แล้ว
3. **OAuth 2.0 Client ID** (ประเภท Desktop app) จาก [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. **Gemini API Key** จาก [Google AI Studio](https://aistudio.google.com/apikey)
5. **Unsplash Access Key** (ไม่บังคับ) จาก [Unsplash Developers](https://unsplash.com/developers)
6. **Pexels API Key** (ไม่บังคับ) จาก [Pexels API](https://www.pexels.com/api/)

## วิธีติดตั้ง

```bash
# โคลน repository
git clone https://github.com/aiunlocked1412/blogger-automation.git
cd blogger-automation

# ติดตั้ง dependencies
npm install
```

## เริ่มต้นใช้งาน

### ขั้นตอนที่ 1: เปิดหน้าเว็บ

```bash
npm run web
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3001](http://localhost:3001)

### ขั้นตอนที่ 2: ตั้งค่า API Keys

ไปที่หน้า **Settings** แล้วกรอกค่าต่อไปนี้:

| ค่าที่ต้องกรอก | หาได้จากไหน |
|---------------|------------|
| Google Client ID | Google Cloud Console > Credentials > OAuth 2.0 Client (เลือกประเภท Desktop app) |
| Google Client Secret | ได้มาพร้อมกับ Client ID ด้านบน |
| Gemini API Key | [Google AI Studio](https://aistudio.google.com/apikey) กด Get API Key |
| Unsplash Access Key | [Unsplash Developers](https://unsplash.com/developers) (ไม่บังคับ ใส่เพื่อดึงรูปอัตโนมัติ) |
| Pexels API Key | [Pexels API](https://www.pexels.com/api/) (ไม่บังคับ ใช้แทน Unsplash ได้) |

กรอกเสร็จกด **Save All Settings**

### ขั้นตอนที่ 3: เชื่อมต่อ Google Account

กดปุ่ม **Connect Google** จะมี popup ขึ้นมาให้ login Google แล้วอนุญาตเข้าถึง Blogger เชื่อมต่อเสร็จ ระบบจะดึงรายชื่อบล็อกของคุณมาแสดงในดรอปดาวน์อัตโนมัติ

### ขั้นตอนที่ 4: สร้างบทความ & โพส

1. ไปที่หน้า **AI Generate**
2. เลือกบล็อกจากดรอปดาวน์
3. พิมพ์หัวข้อ/คีย์เวิร์ดที่ต้องการ
4. (ไม่บังคับ) ใส่ URL ของ Money Site เพื่อแทรก backlink
5. กด **Generate Content**
6. ตรวจสอบบทความที่ AI สร้าง + ดูคะแนน SEO
7. กด **Publish Now** (โพสเลย), **Save as Draft** (บันทึกแบบร่าง) หรือ **Schedule** (ตั้งเวลาโพส)

## วิธีใช้งาน

### ผ่านหน้าเว็บ (แนะนำ)

```bash
npm run web
# เปิดที่ http://localhost:3001
```

### ผ่าน Command Line (CLI)

```bash
# ยืนยันตัวตน
node src/index.js auth

# สร้างบทความ
node src/index.js generate "หัวข้อที่ต้องการ"

# โพสลง Blogger
node src/index.js post "หัวข้อที่ต้องการ"

# ดูรายการโพสล่าสุด
node src/index.js list

# ดูรายการแบบร่าง
node src/index.js drafts
```

## หน้าเว็บแต่ละหน้า

### AI Generate - สร้างบทความด้วย AI
ตั้งค่าการสร้างบทความได้:
- **Topic / Keyword** - หัวข้อหรือคีย์เวิร์ดของบทความ
- **Money Site URL** - ระบบจะแทรก backlink 2-3 จุดในเนื้อหาแบบธรรมชาติ
- **Language** - ภาษาไทย (ค่าเริ่มต้น) หรือภาษาอังกฤษ
- **Word Count** - จำนวนคำโดยประมาณ (ค่าเริ่มต้น: 600)

### Bulk Post - โพสทีละเยอะ
มี 2 โหมด:

**Schedule Bulk** - สร้างบทความหลายชิ้นจากหัวข้อเดียว เนื้อหาไม่ซ้ำกัน (มุมมองต่างกัน: คู่มือเบื้องต้น, เทคนิคขั้นสูง, กรณีศึกษา, FAQ ฯลฯ) ตั้งเวลาโพสห่างกันตามที่กำหนด

**Multi-Blog** - สร้างบทความไม่ซ้ำกัน แล้วโพสไปหลายบล็อกพร้อมกัน (1 บทความ / 1 บล็อก)

### Post / Schedule - เขียนเอง / ตั้งเวลา
เขียนบทความเอง หรือวางเนื้อหาที่เตรียมไว้ (รองรับ Markdown) แล้วโพสทันทีหรือตั้งเวลาโพสในอนาคต

### My Posts / Drafts - จัดการโพส
ดูรายการบทความที่เผยแพร่แล้ว และแบบร่าง สามารถลบได้

## วิธีตั้งค่า Google Cloud (ละเอียด)

### 1. สร้าง Google Cloud Project
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. กด **Select a project** > **New Project**
3. ตั้งชื่อโปรเจกต์แล้วกด **Create**

### 2. เปิดใช้ Blogger API
1. ไปที่ **APIs & Services** > **Library**
2. ค้นหา **"Blogger API v3"**
3. กด **Enable**

### 3. สร้าง OAuth 2.0 Credentials
1. ไปที่ **APIs & Services** > **Credentials**
2. กด **Create Credentials** > **OAuth client ID**
3. ถ้ายังไม่เคยตั้ง Consent Screen จะมีให้ตั้งก่อน:
   - เลือก **External**
   - กรอกชื่อแอป (อะไรก็ได้)
   - ใส่ email ของตัวเอง
   - กด Save
4. กลับมาสร้าง OAuth client ID:
   - Application type: **Desktop app**
   - ตั้งชื่อ (อะไรก็ได้)
   - กด **Create**
5. คัดลอก **Client ID** และ **Client Secret** ไปใส่ในหน้า Settings ของเว็บ

### 4. สร้าง Gemini API Key
1. ไปที่ [Google AI Studio](https://aistudio.google.com/apikey)
2. กด **Get API Key** หรือ **Create API Key**
3. คัดลอก API Key ไปใส่ในหน้า Settings

## โครงสร้างโปรเจกต์

```
blogger-automation/
├── config/
│   └── default.js          # ไฟล์ config กลาง (โหลด settings แบบ live)
├── src/
│   ├── index.js             # CLI entry point
│   ├── auth/
│   │   └── google-auth.js   # OAuth2 login + เก็บ token
│   ├── blogger/
│   │   └── blogger-api.js   # เชื่อมต่อ Blogger API v3 (มี retry)
│   ├── content/
│   │   ├── ai-generator.js  # สร้างบทความด้วย Gemini AI
│   │   ├── file-loader.js   # โหลดไฟล์ Markdown/JSON
│   │   └── templates.js     # HTML templates
│   ├── images/
│   │   └── image-service.js # ดึงรูปจาก Unsplash/Pexels
│   ├── scheduler/
│   │   └── scheduler.js     # จัดการวันเวลาตั้งเวลาโพส
│   ├── seo/
│   │   └── seo-optimizer.js # ตรวจและปรับ SEO
│   ├── utils/
│   │   ├── html-builder.js  # แปลง Markdown เป็น HTML + แทรกรูป
│   │   └── logger.js        # ระบบ log (Winston)
│   └── web/
│       ├── server.js         # Express API server
│       └── public/
│           └── index.html    # หน้าเว็บ UI (Single Page)
├── content/
│   ├── posts/               # ไฟล์บทความที่เตรียมไว้
│   └── topics.json          # คิวหัวข้อสำหรับ batch
├── data/                    # ข้อมูล runtime (ไม่ขึ้น git)
│   ├── settings.json        # ค่าตั้งค่าผู้ใช้
│   └── tokens.json          # OAuth tokens
└── templates/
    └── blog-post.html       # HTML template สำหรับโพส
```

## API Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| GET | `/api/settings` | ดูค่าตั้งค่า (secrets จะถูกซ่อน) |
| POST | `/api/settings` | บันทึกค่าตั้งค่า |
| GET | `/api/auth/status` | เช็คสถานะการเชื่อมต่อ |
| GET | `/api/auth/connect` | เริ่ม OAuth login |
| POST | `/api/auth/disconnect` | ยกเลิกการเชื่อมต่อ |
| GET | `/api/blogs` | ดูรายชื่อบล็อก |
| POST | `/api/blogs/select` | เลือกบล็อกที่ใช้งาน |
| POST | `/api/generate` | สร้างบทความด้วย AI |
| POST | `/api/post` | สร้าง/เผยแพร่บทความ |
| POST | `/api/schedule` | ตั้งเวลาโพสบทความ |
| GET | `/api/posts` | ดูรายการบทความที่เผยแพร่ |
| GET | `/api/drafts` | ดูรายการแบบร่าง |
| DELETE | `/api/posts/:id` | ลบบทความ |
| POST | `/api/seo/check` | ตรวจคะแนน SEO |

## เทคโนโลยีที่ใช้

- **Runtime:** Node.js (ES Modules)
- **Web Framework:** Express 5
- **AI:** Google Gemini 2.5 Flash Lite (`@google/generative-ai`)
- **APIs:** Google Blogger API v3, Unsplash, Pexels
- **CLI:** Commander.js
- **Logging:** Winston
- **Markdown:** Marked + gray-matter

## License

MIT

## ผู้พัฒนา

สร้างด้วย AI โดย [AI Unlocked](https://github.com/aiunlocked1412)
