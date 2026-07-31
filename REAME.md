File: README.md
Markdown
# 🏘️ Community Newsletter CMS

A lightweight, zero-dependency Community Newsletter & Announcement Content Management System (CMS) built with **React** and **Node.js**. 

This platform allows local community administrators to create, edit, save drafts, and publish announcements using a built-in Markdown editor, while providing the public with a clean, searchable feed of announcements.

## ✨ Features

- 🔑 **Admin Authentication:** Simple token/session-based admin login system.
- ✍️ **Markdown Editor:** Rich post creation with formatting toolbars and real-time live preview.
- 🔄 **Publishing Workflow:** Drafts management, publishing, unpublishing, and editing capabilities.
- 📰 **Public Feed:** Clean timeline of published community announcements with real-time title and content search filtering.
- ⚡ **High Performance & Zero Runtime Dependencies:** Built using native React hooks/CSS-in-JS and a pure Node.js HTTP server without external framework bloat.

## 🛠️ Project Tech Stack

- **Frontend:** React 18, Vite
- **Backend:** Node.js (Native `http` module, no Express or heavy third-party libraries)
- **Persistence:** In-Memory / LocalStorage with REST API integration
## 📁 Repository Structure

```text
community-cms/
├── index.html            # Vite HTML entry point
├── package.json          # Project configuration & scripts
├── server.js             # Native Node.js REST API server
└── src/
    ├── App.jsx           # Main React CMS application logic & UI
    └── main.jsx          # React DOM mounting entry point
🚀 Getting Started
Prerequisites
Ensure you have Node.js (v16.x or later) installed on your machine.
1. Installation
Clone the repository and install the development dependencies:
Bash
git clone [https://github.com/YOUR-USERNAME/community-cms.git](https://github.com/YOUR-USERNAME/community-cms.git)
cd community-cms
npm install
💻 Running the Application
Step 1: Start the Backend API Server
In your primary terminal, start the Node.js API server:
Bash
npm run dev:backend
The API server runs at http://localhost:3001.
Step 2: Start the React Frontend
In a new terminal window, start the Vite development server:
Bash
npm run dev:frontend
Open your browser and visit http://localhost:5173.
🔐 Default Admin Credentials
To access the Admin Dashboard and draft/publish announcements, log in with:
•	Username: admin
•	Password: admin123
🔌 API Reference
The backend provides a RESTful interface over standard HTTP:
Method	Endpoint	Description
GET	/api/posts	Fetch all posts (Optional query: ?status=published or ?status=draft)
POST	/api/posts	Create a new announcement post
PUT	/api/posts/:id	Update an existing post or toggle publish status
DELETE	/api/posts/:id	Delete an announcement post by ID
🌐 Deployment
•	Frontend (Vercel): Build command: npm run build, Output directory: dist.
•	Backend (Railway): Start command: node server.js.
📄 License
Distributed under the MIT License. See LICENSE for details.

