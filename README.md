# Wanderlust ✈️🧳

Wanderlust is an interactive, client-side travel planning dashboard that empowers users to explore global destinations, map out public holidays, check live weather, track local entertainment events, and utilize essential travel tools like currency converters and sun-cycle distributions.

This project focuses heavily on **Object-Oriented Programming (OOP)**, **clean code guidelines**, and elegant async JavaScript execution without relying on modern heavy frameworks.

## 🚀 Key Features

- **Decoupled Architecture (OOP):** Driven by specialized JS classes (`Country`, `Plan`) to segregate state tracking, local caching, and UI management.
- **Robust Async API Integration:** Simultaneously orchestrates asynchronous communication with multiple RESTful endpoints:
  - **RestCountries API:** Retrieves geopolitical facts, flag tokens, border variables, and dynamic capital data.
  - **Nager.Date API:** Dynamically renders public holiday grids and identifies strategic long-weekend vacation spots.
  - **Ticketmaster API:** Surfaces live event ticketing data based on chosen locations.
  - **Open-Meteo API:** Provides precise 7-day summaries and 24-hour visual weather forecasting structures.
  - **Sunrise-Sunset API:** Maps solar distribution rates and active daylight curves.
  - **ExchangeRate API:** Calculates live currency pair updates and quick-convert evaluations.
- **Client-Side Plan Persistence:** Implements a localized state engine leveraging the browser's `localStorage` to bookmark, filter, and purge itinerary items cleanly.
- **Performance Tweaks:** Utilizes explicit debounce abstractions on user input events to limit rapid API traffic overhead.

## 🛠️ Tech Stack

- **Structure:** HTML5 (Semantic templates)
- **Styling:** CSS3 (Flexbox, CSS Grid, Custom Theme Variables)
- **Scripting:** Vanilla JavaScript (ES6 Modules, Async/Await)
- **Alert System:** SweetAlert2

## 📁 Repository Structure

- `country.js`: Core domain model managing asynchronous fetches, local caching, time zone conversions, and complex view-rendering matrices.
- `events.js`: Organizes application-wide input streams, dashboard tab routers, and currency conversion state listeners.
- `plan.js`: Encapsulates local array modification methods for saving and auditing trip itineraries.
- `main.js`: Bootstraps global configurations, time tick routines, and shared styling macros.
