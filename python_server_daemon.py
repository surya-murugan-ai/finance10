#!/usr/bin/env python3
"""
Daemon script to run Python FastAPI server in background
"""

import os
import sys
import time
import signal
import atexit
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent.absolute()))

class ServerDaemon:
    def __init__(self, pidfile='/tmp/python_server.pid'):
        self.pidfile = pidfile
        
    def daemonize(self):
        """Daemonize the server process"""
        try:
            pid = os.fork()
            if pid > 0:
                # Exit parent process
                sys.exit(0)
        except OSError as e:
            print(f"Fork failed: {e}")
            sys.exit(1)
            
        # Decouple from parent environment
        os.chdir('/')
        os.setsid()
        os.umask(0)
        
        # Second fork
        try:
            pid = os.fork()
            if pid > 0:
                sys.exit(0)
        except OSError as e:
            print(f"Fork failed: {e}")
            sys.exit(1)
            
        # Write pidfile
        with open(self.pidfile, 'w') as f:
            f.write(str(os.getpid()))
            
        # Register cleanup
        atexit.register(self.cleanup)
        
    def cleanup(self):
        """Clean up pidfile"""
        try:
            os.remove(self.pidfile)
        except FileNotFoundError:
            pass
            
    def start(self):
        """Start the server"""
        print("Starting Python FastAPI server daemon...")
        
        # Check if already running
        if os.path.exists(self.pidfile):
            with open(self.pidfile, 'r') as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, 0)
                print(f"Server already running with PID {pid}")
                return
            except OSError:
                os.remove(self.pidfile)
                
        # Start daemon
        self.daemonize()
        self.run()
        
    def stop(self):
        """Stop the server"""
        if not os.path.exists(self.pidfile):
            print("Server not running")
            return
            
        with open(self.pidfile, 'r') as f:
            pid = int(f.read().strip())
            
        try:
            os.kill(pid, signal.SIGTERM)
            print(f"Stopped server with PID {pid}")
        except OSError:
            print("Server not running")
            
        try:
            os.remove(self.pidfile)
        except FileNotFoundError:
            pass
            
    def run(self):
        """Run the FastAPI server"""
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,
            log_level="info"
        )

if __name__ == "__main__":
    daemon = ServerDaemon()
    
    if len(sys.argv) == 2:
        if sys.argv[1] == 'start':
            daemon.start()
        elif sys.argv[1] == 'stop':
            daemon.stop()
        else:
            print("Usage: python python_server_daemon.py start|stop")
    else:
        print("Usage: python python_server_daemon.py start|stop")