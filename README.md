# 🚀 Galaxium Travels - Interplanetary Booking System

A complete full-stack application for booking interplanetary space travel, featuring a modern React frontend and a FastAPI backend with dual REST and MCP protocol support.

## 🌟 Features

- **Modern Space-Themed UI** - Beautiful, responsive interface with animated starfield
- **Multi-Class Seating** - Economy, Business, and Galaxium class options with dynamic pricing
- **Full Booking System** - Browse flights, make bookings, manage reservations
- **Dual Protocol Backend** - REST API and MCP (Model Context Protocol) support
- **Type-Safe** - Full TypeScript frontend and Python type hints with strict type checking
- **Real-Time Updates** - Live flight availability and booking status per seat class
- **User Management** - Simple name/email authentication
- **Production Ready** - Optimized builds and comprehensive error handling

## 🏗️ Architecture

```
galaxium-travels-infrastructure/
├── booking_system_backend/     # FastAPI backend (Python)
│   ├── server.py              # Main server with REST & MCP
│   ├── services/              # Business logic layer
│   ├── models.py              # SQLAlchemy ORM models
│   └── tests/                 # Test suite
│
├── booking_system_frontend/    # React frontend (TypeScript)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API integration
│   │   └── types/            # TypeScript definitions
│   └── dist/                 # Production build
│
├── start.sh                   # Unix/Mac startup script
└── start.bat                  # Windows startup script
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Option 1: One-Command Start (Recommended)

#### On macOS/Linux:
```bash
./start.sh
```

#### On Windows:
```bash
start.bat
```

This will automatically:
- ✅ Install all dependencies
- ✅ Start the backend server on port 8080
- ✅ Start the frontend dev server on port 5173
- ✅ Open both in separate terminal windows

### Option 2: Manual Start

#### Start Backend:
```bash
cd booking_system_backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

#### Start Frontend (in a new terminal):
```bash
cd booking_system_frontend
npm install
npm run dev
```

## 🌐 Access the Application

Once started, access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs
- **MCP Endpoint**: http://localhost:8080/mcp

## 📚 Documentation

### Backend
See [booking_system_backend/README.md](booking_system_backend/README.md) for:
- API endpoints documentation
- MCP tools reference
- Database schema
- Testing instructions

### Frontend
See [booking_system_frontend/README.md](booking_system_frontend/README.md) for:
- Component documentation
- Styling guide
- Build instructions
- Deployment options

## 🎯 User Guide

### Booking a Flight

1. **Browse Flights** - Navigate to the Flights page to see all available routes
2. **Select Seat Class** - Choose from Economy, Business, or Galaxium class
   - **Economy** - Standard seating at base price (1.0x multiplier)
   - **Business** - Premium comfort at 2.5x base price
   - **Galaxium** - Luxury experience at 4.0x base price
3. **Search & Filter** - Use the search bar to find specific destinations
4. **Sign In/Register** - Click "Book Now" and enter your name and email
5. **Confirm Booking** - Review flight details and confirm your reservation
6. **Manage Bookings** - View and cancel bookings from "My Bookings" page

### Demo Data

The system comes pre-seeded with:
- **10 Users** - Alice, Bob, Charlie, Diana, Eve, Frank, Grace, Heidi, Ivan, Judy
- **10 Flights** - Routes between Earth, Mars, Moon, Venus, Jupiter, Europa, Pluto
- **20 Sample Bookings** - Various booking statuses

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **FastMCP** - MCP protocol support
- **SQLite** - Lightweight database
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 🧪 Testing

### Backend Tests
```bash
cd booking_system_backend
pytest
```

### Frontend Build Test
```bash
cd booking_system_frontend
npm run build
```

## 📦 Production Deployment

### Backend
```bash
cd booking_system_backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8080
```

### Frontend
```bash
cd booking_system_frontend
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Docker Support
Both backend and frontend include Dockerfiles for containerized deployment.

## 🎨 Customization

### Change API URL
Edit `booking_system_frontend/.env`:
```env
VITE_API_URL=https://your-api-url.com
```

### Modify Theme Colors
Edit `booking_system_frontend/tailwind.config.js`:
```js
colors: {
  'cosmic-purple': '#6366F1',
  'nebula-pink': '#EC4899',
  // Add your colors
}
```

## 🐛 Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed: `python --version`
- Check if port 8080 is available
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend won't start
- Ensure Node.js 18+ is installed: `node --version`
- Check if port 5173 is available
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Connection Issues
- Verify backend is running on http://localhost:8080
- Check CORS settings in backend
- Ensure `.env` file exists in frontend with correct API URL

### Type Checking Issues
- Backend uses `typing.cast()` for SQLAlchemy model attributes to satisfy basedpyright
- Frontend imports are optimized to avoid unused variable warnings
- All type errors have been resolved for production-ready code

## 📝 Recent Updates

### Documentation Improvements (Latest)
- ✅ Enhanced `.bob/rules/basic_rules.md` internal monologue documentation
  - Specified precise timestamp format: `YYYY-MM-DD_HH-MM-SS_description.md`
  - Added structured content guidelines (objective, decisions, tools, outcome)
  - Implemented 200-word limit for concise summaries
  - Improved readability with bullet points and bold headers
  - Prevents filename collisions and ensures chronological sorting

### Bug Fixes
- ✅ Fixed SQLAlchemy type checking issues in `flight.py`
  - Resolved `ColumnElement[bool]` type errors using `typing.cast()`
  - Added proper type hints for seat availability checks
  - Fixed assignment type errors with `# type: ignore[assignment]` comments
- ✅ Removed unused `formatDate` import in `FlightCard.tsx`
- ✅ All TypeScript and Python type checking errors resolved

### Features
- ✅ Multi-class seating system (Economy, Business, Galaxium)
- ✅ Dynamic pricing based on seat class
- ✅ Real-time seat availability tracking per class
- ✅ Enhanced booking system with class selection

## 📄 License

This project is part of the Galaxium Travels booking system.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues or questions:
- Check the documentation in each component's README
- Review the troubleshooting section above
- Open an issue on GitHub

---

**Built with ❤️ for space travelers** 🚀✨

*Explore the cosmos, one booking at a time!*