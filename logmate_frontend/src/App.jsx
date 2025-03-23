import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Header Component
const Header = () => (
  <motion.header 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="mb-8 md:mb-12 text-center md:text-left"
  >
    <motion.h1 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="text-4xl md:text-6xl font-black text-white bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent"
    >
      LogMate
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="text-gray-400 mt-2 text-base md:text-lg tracking-wide"
    >
      Your intelligent log processing companion
    </motion.p>
  </motion.header>
);

// Log Upload Component
const LogUpload = ({ onFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const processUploads = async (files) => {
    if (!files.length) return;
    
    setIsUploading(true);
    
    // Create upload queue with priority (smaller files first)
    const queue = Array.from(files).map(file => ({
      file,
      size: file.size,
      name: file.name,
      status: 'queued'
    })).sort((a, b) => a.size - b.size); // Sort by file size (smallest first)
    
    setUploadQueue(queue);
    
    // Get CSRF token once for all uploads
    try {
      console.log("Fetching CSRF token...");
      const csrfResponse = await fetch('https://django-backend-8yn4.onrender.com/csrf-token/', {
        method: 'GET',
        credentials: 'include'
      });

      console.log("CSRF response status:", csrfResponse.status);
      console.log("CSRF response headers:", Object.fromEntries([...csrfResponse.headers.entries()]));

      if (!csrfResponse.ok) {
        const errorText = await csrfResponse.text().catch(e => "Could not read response body");
        console.error("Failed to get CSRF token:", csrfResponse.status, errorText);
        throw new Error(`Failed to get CSRF token: ${csrfResponse.status} ${csrfResponse.statusText}`);
      }

      const csrfData = await csrfResponse.json();
      console.log("CSRF token received successfully");
      const csrfToken = csrfData.csrfToken;
      console.log("CSRF token:", csrfToken);
      // Upload all files concurrently
      const uploadPromises = queue.map(async (queueItem, index) => {
        const { file } = queueItem;
        
        // Size validation
        if (file.size > 600 * 1024 * 1024) { // 600MB
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'error', message: 'File size must be less than 600MB' }
          }));
          return null;
        }

        // Update status to 'uploading'
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'uploading' } : item
        ));

        const formData = new FormData();
        formData.append('log_file', file);

        try {
          console.log("Sending upload request with CSRF token:", csrfToken);
          const uploadHeaders = {
            'X-CSRFToken': csrfToken
          };
          console.log("Request headers:", uploadHeaders);
          
          const response = await fetch('https://django-backend-8yn4.onrender.com/upload/', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: uploadHeaders
          });
          
          console.log("Upload response status:", response.status);
          console.log("Upload response headers:", Object.fromEntries([...response.headers.entries()]));

          if (!response.ok) throw new Error('Upload failed');

          const data = await response.json();
          
          // Update status to 'complete'
          setUploadQueue(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'complete' } : item
          ));
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'success', taskId: data.task_id }
          }));
          
          onFileUpload(data.task_id, file.name);
          return data.task_id;
        } catch (err) {
          setUploadQueue(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'error' } : item
          ));
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { status: 'error', message: err.message }
          }));
          
          return null;
        }
      });

      await Promise.all(uploadPromises);
      
      setIsUploading(false);
      setUploadSuccess(true);
    } catch (err) {
      setIsUploading(false);
      alert('Error uploading files: ' + err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files || e.target.files;
    processUploads(files);
  };

  const resetUpload = () => {
    setUploadSuccess(false);
    setUploadedFileName('');
    setUploadQueue([]);
    setUploadProgress({});
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="col-span-12 lg:col-span-8 bg-gray-900 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-800 hover:border-gray-700 transition-all"
    >
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 md:gap-3"
      >
        <motion.svg 
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
        </motion.svg>
        Upload Logs
      </motion.h2>

      {/* Upload Queue Display */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gray-800/50 p-3 rounded-xl mb-3">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Upload Queue</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                {uploadQueue.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-gray-700/30">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'complete' ? 'bg-emerald-400' :
                        item.status === 'error' ? 'bg-red-400' :
                        item.status === 'uploading' ? 'bg-amber-400' :
                        'bg-blue-400'
                      }`}></span>
                      <span className="text-gray-300 truncate">{item.name}</span>
                    </div>
                    <div className="whitespace-nowrap">
                      {item.status === 'uploading' && (
                        <span className="text-amber-400 flex items-center">
                          <span>Uploading</span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 1, 0] }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.5,
                              times: [0, 0.3, 0.6, 1] 
                            }}
                          >...</motion.span>
                        </span>
                      )}
                      {item.status === 'complete' && (
                        <span className="text-emerald-400">Uploaded</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-red-400">Failed</span>
                      )}
                      {item.status === 'queued' && (
                        <span className="text-blue-400">Queued</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {uploadSuccess && uploadQueue.length === 0 ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="text-center py-6 md:py-8 space-y-4 md:space-y-6"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="bg-emerald-400/10 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto flex items-center justify-center"
            >
              <motion.svg 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <motion.path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </motion.svg>
            </motion.div>
            <div className="space-y-1 md:space-y-2">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-emerald-400 text-lg md:text-xl font-medium"
              >
                All Uploads Successful!
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-gray-400 text-sm md:text-base"
              >
                Your files are being processed
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05, backgroundColor: "#10b981" }}
              whileTap={{ scale: 0.98 }}
              onClick={resetUpload}
              className="px-4 py-2 md:px-6 md:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg md:rounded-xl font-medium transition-colors text-sm md:text-base"
            >
              Upload More Files
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('fileInput').click()}
            className="border-2 border-dashed border-gray-700 rounded-xl md:rounded-2xl p-6 md:p-12 text-center hover:border-gray-500 transition-all cursor-pointer bg-gray-900/50 group relative"
          >
            <input 
              type="file"
              id="fileInput"
              className="hidden"
              accept=".log,.txt"
              onChange={handleDrop}
              multiple
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl"
            ></motion.div>
            <motion.svg 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-600 group-hover:text-emerald-400 transition-colors mb-3 md:mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </motion.svg>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 text-lg md:text-xl font-medium group-hover:text-white transition-colors"
            >
              Drag and drop your log files here
            </motion.p>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base group-hover:text-gray-400 transition-colors"
            >
              or click to browse
            </motion.p>
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 md:mt-6 text-xs md:text-sm text-gray-500"
            >
              <p>Supports multiple .log, .txt files up to 600MB each</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isUploading && uploadQueue.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/70 rounded-2xl z-10"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full"
              ></motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-emerald-400 font-medium"
              >
                Preparing uploads...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Processing Status Component
const ProcessingStatus = ({ taskId, fileName, onTaskSelect }) => {
  const [tasks, setTasks] = useState([]);
  const wsRef = useRef(null); // Create a ref to store WebSocket

  // Initialize WebSocket only once when component mounts
  useEffect(() => {
    // Create a single WebSocket connection for all tasks
    const baseUrl = window.location.hostname === 'localhost' ? 'ws://localhost:8000' : 'wss://django-backend-8yn4.onrender.com';
    wsRef.current = new WebSocket(`${baseUrl}/ws/logstatus/`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      
      if (!data.task_id) {
        console.error("Received message without task_id", data);
        return;
      }
      
      setTasks(prev => {
        // Find if task already exists
        const taskExists = prev.some(task => task.id === data.task_id);
        
        if (taskExists) {
          // Update existing task
          return prev.map(task => {
            if (task.id === data.task_id) {
              switch(data.event) {
                case 'CHUNK':
                  return {
                    ...task,
                    currentChunk: data.chunkIndex,
                    totalChunks: data.totalChunks,
                    processedCount: data.processedCount,
                    totalLines: data.totalLines,
                    progress: (data.processedCount / data.totalLines) * 100,
                    lastUpdated: Date.now()
                  };
                case 'COMPLETE':
                  return {
                    ...task,
                    progress: 100,
                    result: data.result,
                    status: 'complete',
                    lastUpdated: Date.now(),
                    completedAt: Date.now()
                  };
                case 'ERROR':
                  return {
                    ...task,
                    error: data.message,
                    status: 'error',
                    lastUpdated: Date.now()
                  };
                default:
                  return task;
              }
            }
            return task;
          });
        } else {
          // This might be a status update for a task we haven't seen yet
          // (if the user refreshed the page while tasks were running)
          if (data.event === 'CHUNK' || data.event === 'COMPLETE') {
            const newTask = {
              id: data.task_id,
              fileName: data.fileName || `Task-${data.task_id.substring(0, 8)}`, // Use a placeholder if filename isn't sent
              progress: data.event === 'COMPLETE' ? 100 : (data.processedCount / data.totalLines) * 100,
              processedCount: data.processedCount || 0,
              totalLines: data.totalLines || 0,
              currentChunk: data.chunkIndex || 1,
              totalChunks: data.totalChunks || 5,
              error: null,
              result: data.event === 'COMPLETE' ? data.result : null,
              status: data.event === 'COMPLETE' ? 'complete' : 'processing',
              lastUpdated: Date.now(),
              startedAt: Date.now(),
              completedAt: data.event === 'COMPLETE' ? Date.now() : null
            };
            return [...prev, newTask];
          }
          return prev;
        }
      });
    };

    // Clean up only when component unmounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Handle adding new tasks separately
  useEffect(() => {
    if (!taskId || !fileName) return;

    // Skip if this task already exists
    if (tasks.some(task => task.id === taskId)) {
      return;
    }

    // Add new task to queue
    setTasks(prev => [...prev, {
      id: taskId,
      fileName,
      progress: 0,
      processedCount: 0,
      totalLines: 0,
      currentChunk: 0,
      totalChunks: 5,
      error: null,
      result: null,
      status: 'processing',
      lastUpdated: Date.now(),
      startedAt: Date.now()
    }]);
  }, [taskId, fileName, tasks]);

  const handleTaskClick = (task) => {
    if (task.status === 'complete') {
      onTaskSelect(task);
    }
  };

  // Sort tasks by priority: complete first, then errors, then processing
  const sortedTasks = [...tasks].sort((a, b) => {
    // First, sort by status
    if (a.status !== b.status) {
      if (a.status === 'complete') return -1;
      if (b.status === 'complete') return 1;
      if (a.status === 'error') return -1;
      if (b.status === 'error') return 1;
    }
    
    // Then sort by most recent update
    return b.lastUpdated - a.lastUpdated;
  });

  const getEstimatedTimeRemaining = (task) => {
    if (task.status === 'complete' || task.totalLines === 0 || task.processedCount === 0) {
      return null;
    }

    const elapsedMs = Date.now() - task.startedAt;
    const processedFraction = task.processedCount / task.totalLines;
    if (processedFraction <= 0) return null;

    const estimatedTotalMs = elapsedMs / processedFraction;
    const remainingMs = estimatedTotalMs - elapsedMs;
    
    // Return time in seconds
    return Math.max(1, Math.round(remainingMs / 1000));
  };

  const formatRemainingTime = (seconds) => {
    if (!seconds) return 'Calculating...';
    
    if (seconds < 60) {
      return `${seconds}s remaining`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m remaining`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="col-span-12 lg:col-span-4 bg-gray-900/80 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-800/50 hover:border-gray-700/50 transition-all mt-4 lg:mt-0"
    >
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 md:gap-3"
      >
        <motion.svg 
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </motion.svg>
        Processing Queue ({tasks.length})
      </motion.h2>
      
      <AnimatePresence mode="wait">
        {tasks.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8 md:py-12 space-y-3 md:space-y-4"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-gray-800/50 backdrop-blur flex items-center justify-center"
            >
              <motion.svg 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-8 h-8 md:w-10 md:h-10 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
              </motion.svg>
            </motion.div>
            <div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-300 text-base md:text-lg font-medium"
              >
                No logs to process
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base"
              >
                Upload a log file to begin analysis
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="tasks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 md:space-y-6 max-h-[550px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600"
          >
            <AnimatePresence>
              {sortedTasks.map((task, index) => {
                const timeRemaining = getEstimatedTimeRemaining(task);
                
                return (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ 
                      scale: task.status === 'complete' ? 1.02 : 1, 
                      backgroundColor: task.status === 'complete' ? "rgba(31, 41, 55, 0.5)" : "transparent" 
                    }}
                    className={`space-y-4 md:space-y-6 p-4 rounded-xl transition-colors ${
                      task.status === 'complete' ? 'cursor-pointer hover:bg-gray-800/50' : ''
                    }`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-center justify-between">
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <motion.svg 
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                          className="w-4 h-4 text-emerald-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </motion.svg>
                        <span className="text-gray-300 text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-none">{task.fileName}</span>
                      </motion.div>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`text-xs font-medium px-2 md:px-3 py-1 rounded-full ${
                          task.status === 'complete' ? 'bg-emerald-400/10 text-emerald-400' : 
                          task.status === 'error' ? 'bg-red-400/10 text-red-400' :
                          'bg-blue-400/10 text-blue-400'
                        }`}
                      >
                        {task.status === 'complete' ? 'Completed' : 
                         task.status === 'error' ? 'Error' : 
                         'Processing...'}
                      </motion.span>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <div className="w-full bg-gray-800/50 backdrop-blur rounded-full h-1.5 md:h-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${task.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full transition-all duration-300 rounded-full ${
                            task.status === 'error' ? 'bg-red-400' : 
                            task.status === 'complete' ? 'bg-emerald-400' :
                            'bg-blue-400'
                          }`}
                        ></motion.div>
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className={`font-medium ${
                          task.status === 'complete' ? 'text-emerald-400' : 
                          task.status === 'error' ? 'text-red-400' : 
                          'text-blue-400'
                        }`}>
                          {task.status === 'complete' 
                            ? 'Complete' 
                            : task.status === 'error' 
                              ? 'Failed' 
                              : `Chunk ${task.currentChunk} of ${task.totalChunks}`
                          }
                        </span>
                        <span className="text-gray-400">
                          {task.totalLines > 0 
                            ? `${task.processedCount.toLocaleString()} / ${task.totalLines.toLocaleString()} lines` 
                            : 'Calculating...'}
                        </span>
                      </motion.div>
                      
                      {task.status === 'processing' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="text-xs text-gray-500 flex justify-between items-center"
                        >
                          <span>
                            {timeRemaining ? formatRemainingTime(timeRemaining) : 'Calculating...'}
                          </span>
                          <span className="text-gray-500">
                            {task.progress > 0 ? `${Math.round(task.progress)}%` : ''}
                          </span>
                        </motion.div>
                      )}
                      
                      {task.status === 'complete' && task.completedAt && task.startedAt && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-gray-500"
                        >
                          Processing time: {Math.round((task.completedAt - task.startedAt) / 1000)}s
                        </motion.div>
                      )}
                    </div>

                    <AnimatePresence>
                      {task.error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-red-400 text-xs md:text-sm bg-red-400/10 p-3 md:p-4 rounded-lg md:rounded-xl border border-red-400/20"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {task.error}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Task Details Component
const TaskDetails = ({ task }) => {
  const detailsRef = useRef(null);
  
  useEffect(() => {
    if (detailsRef.current) {
      // Smooth scroll to the component when it mounts
      detailsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  if (!task || !task.result) return null;

  return (
    <motion.div 
      ref={detailsRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="col-span-12 bg-gray-900/80 backdrop-blur rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-700/50 mt-6"
    >
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-4"
      >
        <svg className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Analysis Results
      </motion.h2>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
      >
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl shadow-lg border border-gray-700/30"
        >
          <p className="text-gray-400 text-sm font-medium mb-2">Total Lines Processed</p>
          <p className="text-emerald-400 text-2xl font-bold">{task.result.lineCount.toLocaleString()}</p>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl shadow-lg border border-gray-700/30"
        >
          <p className="text-gray-400 text-sm font-medium mb-2">Total Data Size</p>
          <p className="text-emerald-400 text-2xl font-bold">{task.result.totalBytes.toLocaleString()} bytes</p>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-8"
      >
        {Object.keys(task.result.methodsCount).length > 0 && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl shadow-lg border border-gray-700/30"
          >
            <p className="text-gray-400 text-sm font-medium mb-4">HTTP Methods</p>
            <div className="space-y-3">
              {Object.entries(task.result.methodsCount).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">{method}</span>
                  <span className="text-emerald-400 font-bold">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {Object.keys(task.result.statusCount).length > 0 && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl shadow-lg border border-gray-700/30"
          >
            <p className="text-gray-400 text-sm font-medium mb-4">Status Codes</p>
            <div className="space-y-3">
              {Object.entries(task.result.statusCount).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">{status}</span>
                  <span className="text-emerald-400 font-bold">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {task.result.topPaths.length > 0 && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl shadow-lg border border-gray-700/30"
          >
            <p className="text-gray-400 text-sm font-medium mb-4">Most Requested Paths</p>
            <div className="space-y-3">
              {task.result.topPaths.map(([path, count], index) => (
                <div key={index} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 font-medium truncate max-w-[180px]" title={path}>{path}</span>
                    <span className="text-emerald-400 font-bold">{count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700/30 rounded-full h-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / task.result.topPaths[0][1]) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-emerald-400/50 h-full rounded-full transition-all group-hover:bg-emerald-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {task.result.topIPs.length > 0 && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl shadow-lg border border-gray-700/30"
          >
            <p className="text-gray-400 text-sm font-medium mb-4">Top IP Addresses</p>
            <div className="space-y-3">
              {task.result.topIPs.map(([ip, count], index) => (
                <div key={index} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 font-medium truncate max-w-[180px]" title={ip}>{ip}</span>
                    <span className="text-emerald-400 font-bold">{count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700/30 rounded-full h-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / task.result.topIPs[0][1]) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-emerald-400/50 h-full rounded-full transition-all group-hover:bg-emerald-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Insights Component
const Insights = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
      {/* ... (rest of insights code remains the same) ... */}
    </div>
  );
};

// Main App Component
function App() {
  const [taskId, setTaskId] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = (newTaskId, newFileName) => {
    setTaskId(newTaskId);
    setFileName(newFileName);
    setStats(null);
  };

  // Generate a visual report using HTML Canvas
  const handleGenerateReport = async () => {
    if (!selectedTask || !selectedTask.result) return;
    
    setIsGeneratingReport(true);
    
    try {
      // Simulate some processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create canvas element to draw the report
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1120; // A4 size ratio approximately
      const ctx = canvas.getContext('2d');
      
      // Set background
      ctx.fillStyle = '#111827'; // bg-gray-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw header
      ctx.fillStyle = '#10B981'; // emerald-500
      ctx.fillRect(0, 0, canvas.width, 80);
      
      // Draw title
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('LogMate Report', 40, 50);
      
      // Draw timestamp
      const date = new Date().toLocaleString();
      ctx.font = '14px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`Generated: ${date}`, 550, 50);
      
      // Draw file details
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`File: ${selectedTask.fileName}`, 40, 120);
      
      // Draw summary stats
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#10B981';
      ctx.fillText('Summary Statistics', 40, 170);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#D1D5DB'; // gray-300
      ctx.fillText(`Total Lines: ${selectedTask.result.lineCount.toLocaleString()}`, 40, 200);
      ctx.fillText(`Total Size: ${selectedTask.result.totalBytes.toLocaleString()} bytes`, 40, 230);
      
      // Draw HTTP methods
      if (Object.keys(selectedTask.result.methodsCount).length > 0) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#10B981';
        ctx.fillText('HTTP Methods', 40, 280);
        
        let y = 310;
        Object.entries(selectedTask.result.methodsCount).forEach(([method, count]) => {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#D1D5DB';
          ctx.fillText(method, 40, y);
          ctx.fillText(count.toLocaleString(), 200, y);
          y += 30;
        });
      }
      
      // Draw status codes
      if (Object.keys(selectedTask.result.statusCount).length > 0) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#10B981';
        ctx.fillText('Status Codes', 300, 280);
        
        let y = 310;
        Object.entries(selectedTask.result.statusCount).forEach(([status, count]) => {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#D1D5DB';
          ctx.fillText(status, 300, y);
          ctx.fillText(count.toLocaleString(), 400, y);
          y += 30;
        });
      }
      
      // Draw top paths
      if (selectedTask.result.topPaths.length > 0) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#10B981';
        ctx.fillText('Top Requested Paths', 40, 480);
        
        let y = 510;
        selectedTask.result.topPaths.slice(0, 5).forEach(([path, count]) => {
          ctx.font = '14px Arial';
          ctx.fillStyle = '#D1D5DB';
          
          // Truncate long paths
          const displayPath = path.length > 40 ? path.substring(0, 37) + '...' : path;
          ctx.fillText(displayPath, 40, y);
          ctx.fillText(count.toLocaleString(), 500, y);
          y += 30;
        });
      }
      
      // Draw top IPs
      if (selectedTask.result.topIPs.length > 0) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#10B981';
        ctx.fillText('Top IP Addresses', 40, 680);
        
        let y = 710;
        selectedTask.result.topIPs.slice(0, 5).forEach(([ip, count]) => {
          ctx.font = '16px Arial';
          ctx.fillStyle = '#D1D5DB';
          ctx.fillText(ip, 40, y);
          ctx.fillText(count.toLocaleString(), 200, y);
          y += 30;
        });
      }
      
      // Add footer
      ctx.fillStyle = '#10B981';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Generated by LogMate - Your intelligent log processing companion', 40, canvas.height - 15);
      
      // Convert canvas to image and create download link
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `logmate_report_${selectedTask.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Export data as JSON
  const handleExportData = async () => {
    if (!selectedTask || !selectedTask.result) return;
    
    setIsExporting(true);
    
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create export object with metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        fileName: selectedTask.fileName,
        taskId: selectedTask.id,
        data: selectedTask.result
      };
      
      // Convert to JSON and create download link
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `logmate_export_${selectedTask.fileName.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
      link.href = url;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Update the stats when a task is selected
  useEffect(() => {
    if (selectedTask && selectedTask.result) {
      setStats(selectedTask.result);
    }
  }, [selectedTask]);

  // Add smooth scrolling to the entire app
  useEffect(() => {
    // Apply smooth scrolling behavior to the entire document
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Clean up when the component unmounts
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        initial={{ backgroundPosition: "0% 100%" }}
        animate={{ backgroundPosition: "100% 0%" }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="min-h-screen bg-gray-950 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-8"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <Header />
          <div className="grid grid-cols-12 gap-4">
            <LogUpload onFileUpload={handleFileUpload} />
            <ProcessingStatus taskId={taskId} fileName={fileName} onTaskSelect={setSelectedTask} />
            <AnimatePresence>
              {selectedTask && <TaskDetails task={selectedTask} />}
            </AnimatePresence>
            <AnimatePresence>
              {stats && <Insights stats={stats} />}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {selectedTask && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 md:mt-8 flex flex-col md:flex-row gap-3 md:gap-4"
              >
                <motion.button 
                  whileHover={{ scale: isGeneratingReport ? 1 : 1.05, backgroundColor: isGeneratingReport ? undefined : "#10b981" }}
                  whileTap={{ scale: isGeneratingReport ? 1 : 0.98 }}
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className={`bg-emerald-500 text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-colors font-bold text-sm flex items-center justify-center ${
                    isGeneratingReport ? 'opacity-80 cursor-wait' : 'hover:bg-emerald-400'
                  }`}
                >
                  {isGeneratingReport ? (
                    <>
                      <motion.svg 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 mr-2 text-gray-900" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </motion.svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Report
                    </>
                  )}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: isExporting ? 1 : 1.05, backgroundColor: isExporting ? undefined : "rgba(31, 41, 55, 0.8)" }}
                  whileTap={{ scale: isExporting ? 1 : 0.98 }}
                  onClick={handleExportData}
                  disabled={isExporting}
                  className={`border border-gray-700 text-gray-300 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-colors font-bold text-sm flex items-center justify-center ${
                    isExporting ? 'opacity-80 cursor-wait' : 'hover:bg-gray-800'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <motion.svg 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 mr-2 text-gray-300" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </motion.svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Data
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default App;
