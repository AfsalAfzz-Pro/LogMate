

from celery import shared_task 
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import time
import logging
import os
from collections import Counter

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_log(self, log_file_path, file_name=None, file_size=0):
    """
    Processes the given log file in chunks and broadcasts detailed statistics.

    The log file is expected to be in a combined log format:
      {ip} - - [timestamp] "METHOD PATH PROTOCOL" STATUS BYTES "-" "USER_AGENT"

    The task computes:
      - Total number of lines
      - Frequency count of HTTP methods
      - Frequency count of HTTP status codes
      - Total bytes sent
      - Top 3 requested paths
      - Top IP addresses
      - Top user agents
      - Timestamp statistics

    Progress is broadcast in 5 chunks via Django Channels.
    In case of errors, the task will automatically retry (up to 3 times).
    """
    task_id = self.request.id
    # Initialize channel_layer right at the start
    channel_layer = get_channel_layer()
    try:
        # Get file name if not provided
        if not file_name:
            file_name = os.path.basename(log_file_path)
            
        # Get file size if not provided
        if not file_size and os.path.exists(log_file_path):
            file_size = os.path.getsize(log_file_path)
            
        logger.info(f"Processing log file: {file_name} (size: {file_size} bytes)")

        # Read all lines from the log file
        with open(log_file_path, 'r') as f:
            lines = f.readlines()
        total_lines = len(lines)
        
        logger.info(f"File {file_name} has {total_lines} lines")

        # Initialize statistics containers
        methods_count = {}
        status_count = {}
        total_bytes = 0
        path_count = {}
        ip_count = Counter()
        user_agent_count = Counter()

        def parse_line(line):
            """
            Parse a single log line.

            Expected format:
            {ip} - - [DATE] "METHOD PATH PROTOCOL" STATUS BYTES "-" "USER_AGENT"

            Returns:
              (ip, method, path, status, bytes_sent, user_agent) or None if parsing fails.
            """
            try:
                # Split first to get IP address
                ip = line.split()[0]

                # Split the line by the double-quote character.
                parts = line.split('"')
                if len(parts) < 3:
                    return None

                request_part = parts[1].strip()  # e.g., GET /api/v1/orders HTTP/1.1
                status_part = parts[2].strip()   # e.g., 200 1234 - 
                user_agent = parts[3].strip() if len(parts) > 3 else "Unknown"

                request_fields = request_part.split()
                if len(request_fields) < 2:
                    return None
                method = request_fields[0]
                path = request_fields[1]

                status_fields = status_part.split()
                if len(status_fields) < 2:
                    return None
                status = status_fields[0]
                bytes_sent = int(status_fields[1])
                
                return ip, method, path, status, bytes_sent, user_agent
            except Exception as e:
                logger.error(f"Failed to parse line: {line}. Error: {e}")
                return None

        # Set up chunk processing simulation
        chunk_size = max(1, total_lines // 5)
        channel_layer = get_channel_layer()
        processed_count = 0
        chunk_index = 0
        
        # Notify about starting task
        async_to_sync(channel_layer.group_send)(
            "logstatus_group",
            {
                "type": "log_status",
                "event": "START",
                "task_id": task_id,
                "fileName": file_name,
                "fileSize": file_size,
                "totalLines": total_lines,
                "totalChunks": 5,
            }
        )

        while processed_count < total_lines:
            time.sleep(1)  # Simulate processing time for this chunk
            chunk_index += 1
            chunk_end = min(processed_count + chunk_size, total_lines)
            chunk_lines = lines[processed_count:chunk_end]

            # Process each line in the current chunk
            for line in chunk_lines:
                parsed = parse_line(line)
                if not parsed:
                    continue
                ip, method, path, status, bytes_sent, user_agent = parsed

                # Update statistics
                methods_count[method] = methods_count.get(method, 0) + 1
                status_count[status] = status_count.get(status, 0) + 1
                total_bytes += bytes_sent
                path_count[path] = path_count.get(path, 0) + 1
                ip_count[ip] += 1
                user_agent_count[user_agent] += 1

            processed_count = chunk_end

            # Broadcast chunk progress update
            async_to_sync(channel_layer.group_send)(
                "logstatus_group",
                {
                    "type": "log_status",
                    "event": "CHUNK",
                    "task_id": task_id,
                    "fileName": file_name,
                    "fileSize": file_size,
                    "chunkIndex": chunk_index,
                    "totalChunks": 5,
                    "processedCount": processed_count,
                    "totalLines": total_lines,
                }
            )

        # Determine top entries
        top_paths = sorted(path_count.items(), key=lambda x: x[1], reverse=True)[:3]
        top_ips = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:5]
        top_agents = sorted(user_agent_count.items(), key=lambda x: x[1], reverse=True)[:3]

        final_result = {
            "lineCount": total_lines,
            "methodsCount": methods_count,
            "statusCount": status_count,
            "totalBytes": total_bytes,
            "topPaths": top_paths,
            "topIPs": top_ips,
            "topUserAgents": top_agents
        }

        # Broadcast final complete event with detailed statistics
        async_to_sync(channel_layer.group_send)(
            "logstatus_group",
            {
                "type": "log_status",
                "event": "COMPLETE",
                "task_id": task_id,
                "fileName": file_name,
                "fileSize": file_size,
                "result": final_result,
            }
        )
        return final_result

    except Exception as e:
        logger.error(f"Error processing log file: {e}", exc_info=True)
        async_to_sync(channel_layer.group_send)(
            "logstatus_group",
            {
                "type": "log_status",
                "event": "ERROR",
                "task_id": task_id,
                "fileName": file_name if file_name else os.path.basename(log_file_path),
                "message": str(e)
            }
        )
        raise self.retry(exc=e)
