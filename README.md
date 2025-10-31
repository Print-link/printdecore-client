# Print Queue Manager

A modern React + TypeScript application for managing print job submissions with user authentication and submission history.

## Features

- **User Authentication**
  - Login page with email and password
  - Registration page for new users
  - Protected routes that require authentication

- **Print Job Submission**
  - Drag-and-drop file upload
  - Support for multiple file formats (PDF, Images, Documents)
  - Detailed order form with artwork, dimensions, quantity, and location
  - Form validation and submission status feedback

- **Submission History**
  - View all past print job submissions
  - Filter submissions by status (All, Pending, Completed, Failed)
  - Detailed view with file information, order details, and timestamps
  - Status badges and icons for quick identification

- **Protected Layout**
  - Tabbed interface for easy navigation between Home and History
  - User profile display in header
  - Logout functionality

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   ├── ProtectedLayout.tsx    # Main layout with header and tabs
│   └── ProtectedRoute.tsx     # Route guard component
├── contexts/
│   └── AuthContext.tsx        # Authentication context and provider
├── pages/
│   ├── Login.tsx              # Login page
│   ├── Register.tsx           # Registration page
│   ├── Home.tsx               # Print job submission form
│   └── History.tsx            # Submission history page
├── App.tsx                    # Main app component with routing
└── main.tsx                   # Application entry point
```

## Getting Started

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
yarn build
```

### Preview Production Build

```bash
yarn preview
```

## Authentication

The application uses localStorage for authentication persistence. Users can:
- Register with name, email, and password
- Login with email and password
- Stay logged in across browser sessions
- Logout from any protected page

## Submission Storage

Print job submissions are stored in localStorage and persist across sessions. Each submission includes:
- File information (name, size)
- Order details (artwork, dimensions, quantity, location, description)
- Submission timestamp
- Status (pending, completed, failed)

## API Integration

The application submits print jobs to:
- Endpoint: `http://localhost:3000/api/print/submit`
- Method: POST
- Format: FormData with file and order details

Make sure your backend API is running and accessible at this endpoint.

## Features in Detail

### File Upload
- Drag and drop support
- Click to browse files
- File type validation
- File size display
- Remove file option

### Form Validation
- Required field validation
- Real-time validation feedback
- Disabled submit button until form is valid

### History Filters
- Filter by all statuses
- Filter by pending jobs
- Filter by completed jobs
- Filter by failed jobs

## License

MIT
