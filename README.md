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

```
js/
├── constants/
│   └── constants.js     — API base URLs, country data templates, weather templates
├── services/
│   ├── api.js           — HTTP request builders, fetch wrappers (countries, currency)
│   ├── currency.js      — Currency converter listeners, rate displays, swap logic
│   ├── sections.js      — Section card rendering, plan-save handlers, empty states
│   └── weather.js       — Weather code classifiers, icons, wind direction, sun position
├── utils/
│   ├── helpers.js       — Reusable utilities (capitalize, debounce, timezone parser)
│   └── templates.js     — Templates for all sections (cards, states, section components)
├── country.js           — Country class: data model, facts, preview & explore rendering
├── plan.js              — Plan class: localStorage CRUD, card rendering, filter & modals
├── events.js            — Event listener coordinator: navigation, dashboard, plans
└── main.js              — App bootstrap: global selectors, time ticker, country options
```

## 🔒 Security & API Key Management

As Wanderlust is deployed as a static client-side web application on **GitHub Pages**, third-party API credentials (such as the REST Countries v5 Bearer token, Ticketmaster API key, and ExchangeRate API key) are secured through **domain / HTTP referrer restrictions** configured in their respective developer dashboards. Any requests initiated outside authorized domains are automatically blocked by the upstream API providers.
