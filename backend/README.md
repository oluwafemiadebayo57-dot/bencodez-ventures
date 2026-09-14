# Todo API

A REST API for managing personal todos with user authentication. Built with Node.js, Express, and PostgreSQL.

## Features

- ✅ User registration and login with JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Per-user data isolation (users only see their own todos)
- ✅ Full CRUD operations for todos
- ✅ Input validation with Joi
- ✅ Rate limiting to prevent brute-force attacks
- ✅ Secure HTTP headers with Helmet
- ✅ CORS support
- ✅ Global error handling
- ✅ Environment-based configuration

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express** — Web framework
- **PostgreSQL** — Database
- **JWT** — Authentication
- **bcrypt** — Password hashing
- **Joi** — Input validation
- **Helmet** — Security headers
- **express-rate-limit** — Rate limiting

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/YOUR_USERNAME/todo-api.git
   cd todo-api