# LogMate Architecture

## System Overview

LogMate is a web application for analyzing and processing log files concurrently. It provides real-time feedback on processing status and generates visualizations and analytics based on log content.

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│  React        │     │  Django       │     │  Celery       │
│  Frontend     │◄────┤  Backend      │◄────┤  Workers      │
│               │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
        ▲                     ▲                     ▲
        │                     │                     │
        │                     │                     │
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                 WebSockets (Django Channels)             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (React + Framer Motion)
The frontend is built with React and enhanced with Framer Motion for animations. It consists of these main components:

- **App**: Main container component
- **Header**: Application title and description
- **LogUpload**: Handles concurrent file uploads with prioritization
- **ProcessingStatus**: Real-time status tracking for multiple files
- **TaskDetails**: Displays results and analytics for processed files

### 2. Backend (Django)
The Django backend provides REST API endpoints and WebSocket connections:

- **upload_log view**: Handles file uploads and dispatches Celery tasks
- **LogStatusConsumer**: WebSocket consumer for real-time updates

### 3. Asynchronous Processing (Celery)
Celery workers process log files in the background:

- **process_log task**: Analyzes log files in chunks, sends progress updates

### 4. Real-time Communication (Django Channels)
Django Channels manages WebSocket connections for real-time updates.

## Data Flow Diagram

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐     ┌────────────────┐
│             │     │               │     │             │     │                │
│  User       │────►│  File Upload  │────►│  CSRF Token │────►│  Upload Files  │
│             │     │  Component    │     │  Request    │     │  Concurrently  │
│             │     │               │     │             │     │                │
└─────────────┘     └───────────────┘     └─────────────┘     └────────────────┘
                                                                       │
                                                                       │
                                                                       ▼
┌─────────────┐     ┌───────────────┐     ┌─────────────┐     ┌────────────────┐
│             │     │               │     │             │     │                │
│  Results &  │◄────│  WebSocket    │◄────│  Django     │◄────│  Celery Tasks  │
│  Analytics  │     │  Updates      │     │  Channels   │     │  Process Files │
│             │     │               │     │             │     │                │
└─────────────┘     └───────────────┘     └─────────────┘     └────────────────┘
```

## Concurrent Processing Architecture

LogMate implements a multi-worker architecture for concurrent file processing:

```
                    ┌───────────────────────┐
                    │                       │
                    │   Django Backend      │
                    │                       │
                    └───────────────────────┘
                               │
                               │ Distribute Tasks
                               ▼
┌───────────────┬───────────────┬───────────────┬───────────────┐
│               │               │               │               │
│  Celery       │  Celery       │  Celery       │  Celery       │
│  Worker 1     │  Worker 2     │  Worker 3     │  Worker 4     │
│               │               │               │               │
└───────────────┴───────────────┴───────────────┴───────────────┘
        │               │               │               │
        │               │               │               │
        ▼               ▼               ▼               ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                   Redis Message Broker               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
        │               │               │               │
        │               │               │               │
        ▼               ▼               ▼               ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                      Django Channels                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                               │
                               │ WebSocket Updates
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                      React Frontend                           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## File Upload Process

1. User selects multiple log files
2. Frontend sorts files by size (smallest first)
3. Files are uploaded concurrently to Django backend 
4. Each file is assigned a task ID and queued for processing
5. Celery workers pick up tasks based on availability
6. Processing status is broadcast via WebSockets
7. Frontend displays real-time progress for all files

## File Processing Flow

Each log file is processed in 5 chunks:

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐     ┌────────────────┐
│             │     │               │     │             │     │                │
│  Read File  │────►│  Process      │────►│  Update     │────►│  Next Chunk    │
│  Chunk      │     │  Chunk Lines  │     │  Statistics │     │  or Complete   │
│             │     │               │     │             │     │                │
└─────────────┘     └───────────────┘     └─────────────┘     └────────────────┘
       ▲                                                              │
       └──────────────────────────────────────────────────────────────┘
```

## WebSocket Communication

The system uses a single WebSocket connection to handle updates from multiple concurrent tasks:

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  WebSocket Message Types                                           │
│                                                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │            │  │            │  │            │  │            │   │
│  │  START     │  │  CHUNK     │  │  COMPLETE  │  │  ERROR     │   │
│  │  Message   │  │  Message   │  │  Message   │  │  Message   │   │
│  │            │  │            │  │            │  │            │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ App                                                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Header                                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │                        │  │                                │ │
│  │                        │  │                                │ │
│  │                        │  │                                │ │
│  │                        │  │                                │ │
│  │      LogUpload         │  │     ProcessingStatus          │ │
│  │                        │  │                                │ │
│  │                        │  │                                │ │
│  │                        │  │                                │ │
│  │                        │  │                                │ │
│  └────────────────────────┘  └────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ TaskDetails (conditionally rendered)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Log Analysis Components

The system extracts and visualizes the following metrics from log files:

- Total lines processed
- HTTP methods count
- Status code distribution
- Requested paths (top 3)
- Client IP addresses (top 5)
- User agents (top 3)
- Total data size

## Technology Stack

- **Frontend**: React, Framer Motion, TailwindCSS
- **Backend**: Django, Django Channels, Daphne
- **Async Processing**: Celery with 4 workers
- **WebSockets**: Django Channels
- **Message Broker**: Redis/RabbitMQ
- **Web Server**: Daphne (ASGI)

## Scaling Considerations

- The system can scale horizontally by adding more Celery workers
- Large files are processed in chunks to manage memory usage
- File uploads are prioritized by size to optimize user experience
- The WebSocket architecture supports hundreds of concurrent connections
- The frontend is optimized to display multiple concurrent tasks 