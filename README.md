# MDM Backend Server

A robust backend server for Mobile Device Management (MDM) using Google's Android Management API. This server provides RESTful endpoints to manage Android devices, issue commands, and monitor device status.

## Features

- **Device Management**: List, view, and manage Android devices
- **Command Execution**: Issue commands like lock, reboot, wipe data, and app management
- **Enterprise Management**: View enterprise information and policies
- **RESTful API**: Clean, well-documented API endpoints
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Robust error handling and validation
- **Logging**: Structured logging with Winston
- **Security**: Helmet.js for security headers and CORS support
- **Environment Configuration**: Flexible configuration management

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Project with Android Management API enabled
- Service Account with Android Management permissions

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd MDM_Backend
npm install
```

### 2. Google Cloud Setup

1. Create a Google Cloud Project
2. Enable the Android Management API
3. Create a Service Account with the "Android Management User" role
4. Download the service account JSON key file
5. Place the key file in the project root as `service-account-key.json`

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json
ENTERPRISE_ID=your_enterprise_id

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Build and Run

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:deviceName` - Get device details
- `POST /api/devices/:deviceName/commands` - Issue a command
- `POST /api/devices/:deviceName/lock` - Lock device
- `POST /api/devices/:deviceName/reboot` - Reboot device
- `POST /api/devices/:deviceName/wipe` - Wipe device data

### Enterprise
- `GET /api/enterprise` - Get enterprise information
- `GET /api/enterprise/policies` - List all policies

### Operations
- `GET /api/devices/operations/:operationName` - Get operation status

## Example Usage

### List Devices
```bash
curl http://localhost:3000/api/devices
```

### Lock a Device
```bash
curl -X POST http://localhost:3000/api/devices/enterprises/your_enterprise_id/devices/device_id/lock \
  -H "Content-Type: application/json" \
  -d '{"duration": "300s"}'
```

### Issue Custom Command
```bash
curl -X POST http://localhost:3000/api/devices/enterprises/your_enterprise_id/devices/device_id/commands \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CLEAR_APP_DATA",
    "packageName": "com.example.app"
  }'
```

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── environment.ts
│   └── logger.ts
├── services/        # Business logic services
│   └── androidManagementService.ts
├── routes/          # Express routes
│   ├── devices.ts
│   └── enterprise.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── index.ts         # Main server file
```

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Code Style
This project uses ESLint for code linting and follows TypeScript best practices. Run `npm run lint` to check for issues.

## Security Considerations

- Store service account keys securely and never commit them to version control
- Use environment variables for sensitive configuration
- Implement proper authentication and authorization for production use
- Regularly rotate service account keys
- Monitor API usage and implement rate limiting

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Logging

The server uses Winston for structured logging. Logs include:
- Request/response information
- Error details with stack traces
- Service operation results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
# mdm_backend
