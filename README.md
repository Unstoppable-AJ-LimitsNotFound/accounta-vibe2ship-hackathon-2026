![Accounta Logo](/Accounta_full_logo.png)

# Accounta
### *AI-powered habit accountability — real consequences for real change.*

---

## 🚀 The Problem Statement: The Last-Minute Life Saver
**Vibe2Ship Hackathon 2026**

Traditional habit trackers fail because they rely entirely on self-discipline. When you fail to complete your habits, the worst that happens is a broken streak icon on an app only you can see. There is no urgency, no social stake, and zero consequence. 

**Accounta** turns the table. It is designed as a *Last-Minute Life Saver*—an uncompromising accountability engine where slipping up on your habits triggers immediate, real-world, and highly visible consequences. If you fail to complete your habits, your selected accountability partner is immediately notified, and your app is locked down under a strict public shame protocol.

---

## 🎯 Overview

Accounta is a consequence-driven, full-stack habit tracking ecosystem built around deep human-to-human accountability and intelligent AI feedback. By pairing real-time tracking with an automated social-consequence loop, Accounta makes the cost of failure higher than the effort of execution. If you slip up, your accountability partner receives automatic alerts, and you must publicly own up to your laziness on social media before you can unlock your board again.

---

## 🛠️ Key Features

### 👤 Authentication & Profiles
*   **Secure Supabase Auth**: Reliable email-based login and session persistence powered by Supabase.
*   **Onboarding & Partner Setup**: Seamless setup wizard to register your Accountability Partner’s name and email, link your Twitter/X and LinkedIn profiles, and grant secure API permissions.
*   **Encrypted Storage**: Secure, client-side caching synced with cloud profiles to guarantee safe token handling.

### 📅 Habit Tracking
*   **Interactive Habit Grid**: Elegant, responsive grid layouts highlighting your tracking history with bespoke color mappings.
*   **Dynamic Day Interactions**: Tap once to mark a habit as complete, tap again to skip (ideal for sick days or planned rest days without breaking your current streak), and tap once more to clear back to unmarked.
*   **Interactive Controls**: Full keyboard actions (`M` to Mark, `S` to Skip, `U` to Unmark) available on desktop configurations.

### 🚨 Accountability & Shame Protocol
*   **Undismissable Shame Overlay**: Missed habits from yesterday automatically trigger a full-screen red lockdown overlay. The overlay remains active and completely blocks access to the app until resolution conditions are met.
*   **Social Proof Release**: To release the lockdown, users must publicly publish their AI-generated shame post to Linked/Twitter. The unlock button is guarded by click/copy verification checks to guarantee follow-through.

### 🎉 Milestone Celebrations
*   **Scientific Habit Milestones**: Special congratulations triggered upon hitting pivotal streak thresholds of 7, 21, 66, and 100 days (the proven scientific timeline for neuroplastic habit formation).
*   **Engagement Loops**: Celebrates milestones with rich full-screen particle confetti bursts and automated congratulatory notification emails sent straight to your partner.

### 📧 Automated Email System
*   **End-of-Day (EOD) Reports**: Automated digests detailing completed, skipped, and missed habits sent straight to your partner to keep them perfectly in the loop.
*   **Critical Zero-Habit Alerts**: Urgent partner notifications if absolutely zero progress has been registered by key times.
*   **Escalating Reminders**: When the Shame Protocol is active, follow-up emails are sent 10 hours after the initial breach, followed by escalating hourly reminders until the user resolves the lockout.

### 🤖 Gemini AI Personalization
*   **Bespoke Shame Post Drafting**: Fully integrated server-side with Google Gemini models. Gemini analyzes your specific missed habits and dynamically generates engagingly humorous, deeply apologetic, and highly embarrassing social draft posts.
*   **Intelligent Tone Alignment**: Combines humor with actual psychological friction to encourage habit compliance.

### 📱 Mobile Responsive Design
*   **Optimized Space Efficiency**: Clean visual hierarchies that look gorgeous on both ultra-wide desktop monitors and mobile displays.
*   **Horizontally Scrollable Timelines**: Smooth swipe-to-scroll habit grids on smaller screens with elegant guiding visual hints (`Scroll to see today →`).
*   **Adaptive Media Queries**: Hides secondary legends (like the M/S/U desktop key commands) on touch devices where hover is unsupported, ensuring zero clutter.

---

## 💻 Tech Stack

*   **Framework**: Next.js 15+ (App Router, Server Components)
*   **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Framer Motion)
*   **Database & Auth**: Supabase Database & Supabase Auth
*   **AI Engine**: Google Gemini AI (via `@google/genai` SDK)
*   **Notification Engine**: Gmail API (Google OAuth & secure mail relays)
*   **Workspace Integration**: Google AI Studio, Google Cloud Run

---

## 🏆 Hackathon Submission

This project was built using **Google AI Studio's Build Mode** for the **Vibe2Ship Hackathon 2026** by team **Coding Ninjas** in collaboration with **Google for Developers**.

---

## 🔗 Links

*   **Live Deployed Application**: [https://accounta-vibe2ship-2026-388308312011.us-west1.run.app/](https://accounta-vibe2ship-2026-388308312011.us-west1.run.app/)
*   **GitHub Repository**: [https://github.com/Unstoppable-AJ-LimitsNotFound/accounta-vibe2ship-hackathon-2026](https://github.com/Unstoppable-AJ-LimitsNotFound/accounta-vibe2ship-hackathon-2026)
