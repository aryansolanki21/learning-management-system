# SkillNest

**Live demo:** https://skillnest-learning.vercel.app

SkillNest is a full-stack learning management platform for discovering courses, managing course content, purchasing courses, and tracking learning progress.

## Features

- Browse, search, and filter courses; view course details, lectures, previews, prices, and reviews
- Email OTP registration, email/password login, and Google sign-in
- JWT access and refresh tokens with HTTP-only cookies and automatic token refresh
- Instructor course and lecture management with a responsive admin dashboard
- Course checkout with Razorpay and server-side payment verification
- Course media uploads using Cloudinary and Multer
- Enrollment and learning progress tracking

## Tech Stack

**Frontend**

- React + Vite
- Redux Toolkit + RTK Query
- React Router
- Tailwind CSS + Shadcn UI
- Google OAuth client integration

**Backend**

- Node.js + Express
- MongoDB + Mongoose
- JWT, bcrypt, and HTTP-only cookies
- EmailJS (OTP email delivery)
- Google OAuth token verification
- Razorpay (payments)
- Cloudinary + Multer (media uploads)

## Getting Started (Local)

### Prerequisites

- Node.js and npm
- MongoDB database (local or MongoDB Atlas)
- EmailJS configuration for email verification
- Google OAuth Web Client ID
- Cloudinary and Razorpay credentials for media uploads and payments

### 1. Clone the repository

```bash
git clone https://github.com/aryansolanki21/learning-management-system.git
cd learning-management-system
```

### 2. Install dependencies

```bash
npm install --prefix server
npm install --prefix client
```

### 3. Configure environment variables

Create local environment files from the examples in the project root:

```powershell
Copy-Item .\server\.env.example .\server\.env
Copy-Item .\client\.env.example .\client\.env.local
```

## **Environment Variables (Backend)**

- `PORT=8080`
- `NODE_ENV=development`
- `MONGO_URI=your_mongodb_connection_string`
- `CLIENT_URL=http://localhost:5173`
- `JWT_SECRET=your_access_token_secret`
- `JWT_EXPIRES_IN=15m`
- `JWT_REFRESH_SECRET=your_refresh_token_secret`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `EMAIL_OTP_SECRET=your_otp_hashing_secret`
- `BCRYPT_SALT_ROUNDS=12`
- `EMAILJS_SERVICE_ID=your_emailjs_service_id`
- `EMAILJS_TEMPLATE_ID=your_emailjs_template_id`
- `EMAILJS_PUBLIC_KEY=your_emailjs_public_key`
- `EMAILJS_PRIVATE_KEY=your_emailjs_private_key`
- `GOOGLE_CLIENT_ID=your_google_oauth_web_client_id`
- `CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name`
- `CLOUDINARY_API_KEY=your_cloudinary_api_key`
- `CLOUDINARY_API_SECRET=your_cloudinary_api_secret`
- `RAZORPAY_KEY_ID=your_razorpay_key_id`
- `RAZORPAY_KEY_SECRET=your_razorpay_key_secret`

## **Environment Variables (Frontend)**

- `VITE_API_BASE_URL=http://localhost:8080`
- `VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id`

Use the same Google OAuth Web Client ID for both the frontend and backend. The default local frontend origin is `http://localhost:5173`, and the backend runs on port `8080`.

### 4. Start the backend

```bash
npm --prefix server run dev
```

### 5. Start the frontend

In a second terminal:

```bash
npm --prefix client run dev
```

Vite runs the frontend at `http://localhost:5173` by default.

## API Routes

### Base URL: `/api/v1/user`

| Method | Endpoint               | Auth           | Purpose                                     |
| ------ | ---------------------- | -------------- | ------------------------------------------- |
| POST   | `/register`            | No             | Register an account and send email OTP.     |
| POST   | `/verify-email`        | No             | Verify email using OTP.                     |
| POST   | `/resend-verification` | No             | Resend email verification OTP.              |
| POST   | `/login`               | No             | Log in with email and password.             |
| POST   | `/google`              | No             | Sign in or register using Google OAuth.     |
| POST   | `/refresh`             | Refresh cookie | Refresh access and refresh tokens.          |
| POST   | `/logout`              | Cookie         | Clear authentication cookies and log out.   |
| GET    | `/profile`             | User           | Get the logged-in user's profile.           |
| PUT    | `/profile/update`      | User           | Update profile details or photo.            |
| GET    | `/my-learning`         | User           | Get enrolled courses and learning progress. |

### Base URL: `/api/v1/course`

| Method | Endpoint                        | Auth | Purpose                                |
| ------ | ------------------------------- | ---- | -------------------------------------- |
| POST   | `/`                             | User | Create a course.                       |
| GET    | `/`                             | User | Get courses created by the instructor. |
| GET    | `/search`                       | No   | Search and filter courses.             |
| GET    | `/published-courses`            | No   | List published courses.                |
| GET    | `/recommended`                  | User | Get recommended courses.               |
| GET    | `/:courseId`                    | No   | Get course details by ID.              |
| PATCH  | `/:courseId`                    | User | Update course details.                 |
| DELETE | `/:courseId`                    | User | Delete a course.                       |
| PATCH  | `/:courseId/publish`            | User | Publish or unpublish a course.         |
| POST   | `/:courseId/lecture`            | User | Add a lecture to a course.             |
| GET    | `/:courseId/lecture`            | User | Get course lectures.                   |
| PATCH  | `/:courseId/lecture/:lectureId` | User | Update a lecture.                      |
| DELETE | `/:courseId/lecture/:lectureId` | User | Delete a lecture.                      |

### Base URL: `/api/v1/media`

| Method | Endpoint        | Auth | Purpose                            |
| ------ | --------------- | ---- | ---------------------------------- |
| POST   | `/upload-video` | User | Upload course media to Cloudinary. |

### Base URL: `/api/v1/purchase`

| Method | Endpoint                               | Auth     | Purpose                                 |
| ------ | -------------------------------------- | -------- | --------------------------------------- |
| POST   | `/checkout/create-order`               | User     | Create a Razorpay payment order.        |
| POST   | `/checkout/verify`                     | User     | Verify payment and confirm purchase.    |
| GET    | `/course/:courseId/detail-with-status` | Optional | Get course details and purchase status. |
| GET    | `/`                                    | User     | Get courses purchased by the user.      |

### Base URL: `/api/v1/progress`

| Method | Endpoint                             | Auth | Purpose                          |
| ------ | ------------------------------------ | ---- | -------------------------------- |
| GET    | `/:courseId`                         | User | Get course learning progress.    |
| POST   | `/:courseId/lecture/:lectureId/view` | User | Update lecture viewing progress. |
| POST   | `/:courseId/complete`                | User | Mark a course as completed.      |
| POST   | `/:courseId/incomplete`              | User | Mark a course as incomplete.     |

### Base URL: `/api/v1/review`

| Method | Endpoint             | Auth | Purpose                   |
| ------ | -------------------- | ---- | ------------------------- |
| GET    | `/:courseId/reviews` | No   | Get reviews for a course. |
| POST   | `/:courseId/review`  | User | Submit a course review.   |
| PATCH  | `/:courseId/review`  | User | Update a course review.   |
| DELETE | `/:courseId/review`  | User | Delete a course review.   |

### Base URL: `/api/v1/analytics`

| Method | Endpoint                | Auth | Purpose                             |
| ------ | ----------------------- | ---- | ----------------------------------- |
| GET    | `/instructor-dashboard` | User | Get instructor dashboard analytics. |

## Auth Notes

- Authentication uses JWT access and refresh tokens stored in HTTP-only cookies.
- Email OTP verification, Google OAuth, and password-based login are supported.
- Protected endpoints require authentication; course-detail endpoints support guest access.
