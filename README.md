# 🚀 RAFI (Rare Artificial Food Intelligence)

RAFI is a comprehensive, full-stack Android application designed for precise nutrition tracking. It enables users to monitor their daily macronutrient intake (Calories and Protein) through an intuitive interface and dynamic data visualizations, making it easier to achieve fitness goals.

> **Note:** The application's user interface is primarily in **Greek**, combined with some English terminology.

## 📱 Screenshots

<table>
  <tr>
    <td>Home (Dark Mode)<br><br><b><img width="1280" height="2772" alt="Screenshot_2026-08-03-13-36-04-128_com apostolouprojects Frontend" src="[https://github.com/user-attachments/assets/57a7be7a-f29a-40b8-9020-8c800d62f55e](https://github.com/user-attachments/assets/57a7be7a-f29a-40b8-9020-8c800d62f55e)" /></b></td>
    <td>Analytics (Dark Mode)<br><br><b><img width="1280" height="2772" alt="Screenshot_2026-08-03-13-36-28-187_com apostolouprojects Frontend" src="[https://github.com/user-attachments/assets/2d27981e-cf35-42f2-9bff-574fd06a88b8](https://github.com/user-attachments/assets/2d27981e-cf35-42f2-9bff-574fd06a88b8)" /></b></td>
    <td>Recipes (Light Mode)<br><br><b><img width="1280" height="2772" alt="Screenshot_2026-08-03-13-36-56-983_com apostolouprojects Frontend" src="[https://github.com/user-attachments/assets/471162b8-07dd-4bd6-b640-45e83778ed46](https://github.com/user-attachments/assets/471162b8-07dd-4bd6-b640-45e83778ed46)" /></b></td>
  </tr>
</table>

## ✨ Key Features
* **Daily Analytics:** Real-time tracking of Calories & Protein with dynamic charts (Line & Pie charts).
* **Smart Meal Logging:** Seamless addition and categorization of meals (Breakfast, Lunch, Dinner, Snacks).
* **Custom Recipes:** Built-in database for users to browse, create, and manage custom meals and recipes.
* **Dark/Light Mode:** Full support for system-wide appearance themes.
* **Secure Access:** Robust user authentication and session management.

## 🛠 Tech Stack
This project is built using a modern, decoupled architecture:
* **Frontend:** React Native (built with Expo & Expo Router).
* **Backend:** Python / FastAPI (providing a fast, asynchronous RESTful API).
* **Database:** PostgreSQL (hosted on Supabase) utilizing SQLAlchemy for ORM.
* **Deployment:** 
  * Backend hosted on **Render**.
  * Frontend built via **EAS (Expo Application Services)**.

## 📥 Download & Install
You can download the latest compiled Android APK directly from the [Releases](../../releases) page.
1. Download `RAFI.apk` to your Android device.
2. Tap the file to install (allow installation from "Unknown Sources" if prompted).

## 💻 Local Development Setup

If you want to run this project locally, follow these steps:

### Backend Setup
1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set up your `.env` file with your Supabase database credentials.
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Use the **Expo Go** app on your phone to scan the QR code and run the app.
