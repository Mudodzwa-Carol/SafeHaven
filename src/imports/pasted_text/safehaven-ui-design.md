Design a clean and modern web application interface for a mental health support platform called "Safehaven". The design must be structured in a way that allows easy integration with a backend API and an AI mood detection service.

The layout should follow a component based structure that can be implemented directly in React. Each section must be clearly separated so it can connect to backend endpoints such as an AI analysis API.

1. Overall Design Style

Create a calm and minimal interface using soft colors such as light blue, green, and neutral tones. The layout must be simple, uncluttered, and easy to convert into reusable React components.

Use a card based layout with clear spacing and consistent alignment.

1. Required Sections (Design them as independent components)

Each section must look like a separate UI component that can connect to backend data.

Navbar Component

App name: Safehaven

Tagline: Anonymous Mental Health Support

Clean and simple header layout

AI Input Component (Most Important Part)

Design a large input card that includes:

A textarea where users type how they feel

Placeholder text: How are you feeling today?

A primary button labeled Analyze Mood

A loading state for when the AI is processing

A small helper text below the input such as:
"Your message will be analyzed anonymously"

The input section must clearly look like a component that sends data to an API.

AI Result Component

Create a separate card that displays:

Mood result (Positive, Neutral, Negative)

A short supportive message returned by the backend

A confidence indicator or simple label (optional)

The design must clearly allow dynamic content to be inserted from an API response

Suggestions Component

Design a card that displays:

2 to 3 suggestions returned from the backend

Each suggestion should appear as a small card or list item

Must support dynamic content (not static text)

Mood History Component

Create a section that can display:

A list of previous mood results

Date and mood label

The layout must support data coming from a backend database

Security and Privacy Component

Design a small card showing:

Your data is anonymous

No personal information is stored

This is not medical advice

This helps the platform appear trustworthy and secure.

1. Layout Structure (Important for Backend Integration)

Design the page using clearly separated components in this order:

Navbar

Security Notice

AI Input Component

AI Result Component

Suggestions Component

Mood History Component

Each section should look modular so it can easily be connected to backend APIs.

1. Interaction Requirements

The design must include:

Button loading state

Disabled button when input is empty

Clear result display after analysis

Smooth transition between input and results

1. Technical Requirements for Implementation

The design should be easy to convert into:

React functional components

Tailwind CSS layout

Axios API integration

A backend endpoint such as:
POST /api/analyze

Avoid overly complex UI elements that are difficult to implement.

1. Style Guidelines

Clean, modern, and calm

Minimal animations

Clear typography hierarchy

Soft shadows and rounded cards

Mobile responsive layout
