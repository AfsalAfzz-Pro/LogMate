#!/usr/bin/env python3
import sys
import random
import datetime
import os

# Example user agents to pick from
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/95.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2) like Mac OS X AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148",
    "curl/7.68.0",
    "Wget/1.21.1"
]

# Example HTTP methods
METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD"]

# Some example paths
PATHS = [
    "/",
    "/api/v1/users",
    "/api/v1/orders",
    "/login",
    "/logout",
    "/static/css/main.css",
    "/static/js/app.js",
    "/images/logo.png"
]

# Common HTTP status codes
STATUS_CODES = [200, 201, 301, 302, 400, 401, 403, 404, 500, 502, 503]

def random_ip():
    """Generate a random IPv4 address."""
    return ".".join(str(random.randint(0, 255)) for _ in range(4))

def random_datetime():
    """
    Generate a random datetime within the last 30 days.
    Return as a string in Apache/Nginx log format: [dd/Mon/yyyy:HH:MM:SS +0000]
    """
    now = datetime.datetime.utcnow()
    delta_days = random.randint(0, 30)
    delta_seconds = random.randint(0, 86400)
    random_time = now - datetime.timedelta(days=delta_days, seconds=delta_seconds)
    return random_time.strftime("[%d/%b/%Y:%H:%M:%S +0000]")

def random_log_line():
    """
    Create one log line in a format similar to:
    123.45.67.89 - - [22/Mar/2025:15:42:10 +0000] "GET /api/v1/orders HTTP/1.1" 200 1234 "-" "Mozilla/5.0..."
    """
    ip = random_ip()
    time_str = random_datetime()
    method = random.choice(METHODS)
    path = random.choice(PATHS)
    protocol = "HTTP/1.1"
    status = random.choice(STATUS_CODES)
    bytes_sent = random.randint(200, 5000)
    user_agent = random.choice(USER_AGENTS)
    return f'{ip} - - {time_str} "{method} {path} {protocol}" {status} {bytes_sent} "-" "{user_agent}"'

def generate_log_file(output_file, target_size_mb):
    target_size_bytes = target_size_mb * 1024 * 1024
    print(f"Generating log file {output_file} with approximately {target_size_mb}MB...")
    with open(output_file, "w") as f:
        while os.path.getsize(output_file) < target_size_bytes:
            f.write(random_log_line() + "\n")
    print(f"{output_file} generated successfully.")

def main():
    num_files = 10
    min_size_mb = 200
    max_size_mb = 500

    for i in range(1, num_files + 1):
        output_file = f"logfile_{i}.log"
        target_size_mb = random.randint(min_size_mb, max_size_mb)
        generate_log_file(output_file, target_size_mb)

    print("All log files generated successfully.")

if __name__ == "__main__":
    main()