# Uber Clone - Full-Stack Ride-Hailing Platform 🚕

A production-ready, full-stack Uber clone built using the **MERN** stack. This application features real-time location tracking, dynamic fare calculation, instant driver-rider matching via WebSockets, interactive live maps, and OTP-authenticated ride verification.

![Uber Clone Banner](https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png)

---

## 🔗 Live Deployments

* **Frontend App:** [https://uber-clone-frontend-lemon.vercel.app](https://uber-clone-frontend-lemon.vercel.app/)
* **Backend API:** [https://uber-clone-backend-brown.vercel.app](https://uber-clone-backend-brown.vercel.app/)

---

## ✨ Features

### 👤 Rider Platform
* **Authentication:** Secure user signup/login using JWT and HTTP cookies.
* **Ride Booking:** Interactive location selection with pickup/drop-off autocompletion.
* **Fare Estimation:** Real-time fare calculation based on distance and vehicle tier (`Auto`, `Car`, `Moto`).
* **Live Driver Tracking:** Real-time tracking of assigned captains on an interactive Leaflet map.
* **OTP Verification:** Ride confirmation via secure OTP verification prior to starting the trip.

### 🚘 Captain (Driver) Platform
* **Real-time Ride Dispatch:** Receive instant trip request popups via Socket.io.
* **Location Broadcasting:** Automated background geolocation tracking for active drivers.
* **Ride Management:** Seamless workflow to accept requests, verify passenger OTPs, and complete trips.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React.js (Vite)
* **Routing:** React Router DOM
* **Styling:** Tailwind CSS, Remixicon
* **State & Animations:** Context API, GSAP (`@gsap/react`)
* **Real-time & Maps:** Socket.io Client, React-Leaflet / Leaflet

### Backend
* **Runtime & Framework:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose ORM)
* **Real-time Gateway:** Socket.io
* **Authentication & Validation:** JSON Web Tokens (JWT), Express Validator, Cookie Parser
* **Deployment:** Vercel Serverless Functions

---

## 📁 Project Structure

```text
UBER-CLONE/
├── frontend/
│   ├── src/
│   │   ├── components/       # Ride popups, driver details, map tracking
│   │   ├── context/          # Socket, User, and Captain context providers
│   │   ├── pages/            # Rider and Captain dashboards
│   │   └── App.jsx           # Main router configuration
│   └── package.json
│
└── backend/
    ├── controllers/          # Business logic for users, captains, and rides
    ├── models/               # MongoDB schemas (User, Captain, Ride, Blacklist)
    ├── routes/               # API endpoint definitions
    ├── services/             # Maps API integration and fare calculations
    ├── db/                   # Database connection setup
    └── server.js             # Express app & Socket.io initialization
