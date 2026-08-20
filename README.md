# 🎓 Smart Learning Management Platform

A full-stack **MERN-based Learning Management System** for students and instructors, supporting course management, secure payments, media uploads, enrollment, and learning progress tracking.

## 🚀 Features

- 🔐 **JWT Authentication & Role-Based Access**
  - Student and instructor roles
  - HTTP-only cookie authentication
  - Protected and role-based routes

- 📚 **Course Management**
  - Create, edit and publish courses
  - Course thumbnail uploads
  - Lecture creation and management

- 🔎 **Course Search & Filtering**
  - Search published courses
  - Filter courses by category and other criteria

- 💳 **Razorpay Payments**
  - Course checkout
  - Razorpay order creation
  - Server-side payment signature verification

- 🎓 **Enrollment & Course Access**
  - Automatic enrollment after successful payment
  - My Learning section
  - Purchased-course access protection

- 📈 **Learning Progress**
  - Track lecture completion
  - Track course progress

- ☁️ **Media Management**
  - Multer for handling uploads
  - Cloudinary for media storage

- ⚡ **RTK Query**
  - API state management
  - Request caching
  - Loading/error states
  - Cache invalidation

- 🎨 **Responsive UI**
  - React
  - Tailwind CSS
  - shadcn/ui
  - React Router

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, React Router, Redux Toolkit, RTK Query, Tailwind CSS, shadcn/ui, Vite |
| Backend | Node.js, Express.js, REST APIs, JWT, bcrypt |
| Database | MongoDB, Mongoose |
| Payments | Razorpay |
| Media Storage | Cloudinary |
| File Uploads | Multer |
| Tools | Git, GitHub, Postman |

## 🔄 Application Flow

### 👨‍🎓 Student

```text
Browse Courses
      ↓
Search / Filter
      ↓
Course Details
      ↓
Razorpay Checkout
      ↓
Payment Verification
      ↓
Enrollment
      ↓
My Learning
      ↓
Course Progress
