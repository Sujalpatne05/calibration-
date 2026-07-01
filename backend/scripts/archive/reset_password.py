#!/usr/bin/env python3
import subprocess
import os
import sys

# PostgreSQL installation paths
pg_bin = r"C:\Program Files\PostgreSQL\18\bin"
pg_data = r"C:\Program Files\PostgreSQL\18\data"
pg_ctl = os.path.join(pg_bin, "pg_ctl.exe")
initdb = os.path.join(pg_bin, "initdb.exe")

print("PostgreSQL Password Reset Tool")
print("=" * 50)

# Check if running as admin
try:
    import ctypes
    is_admin = ctypes.windll.shell.IsUserAnAdmin()
except:
    is_admin = False

if not is_admin:
    print("ERROR: This script needs to run as Administrator")
    print("Please right-click and select 'Run as Administrator'")
    sys.exit(1)

print("Step 1: Stopping PostgreSQL service...")
try:
    subprocess.run(["net", "stop", "postgresql-x64-18"], check=True)
    print("✓ PostgreSQL stopped")
except Exception as e:
    print(f"Could not stop service: {e}")

print("\nStep 2: Starting PostgreSQL in single-user mode...")
try:
    subprocess.Popen([pg_ctl, "-D", pg_data, "-U", "postgres", "start", "-l", "pg.log"])
    print("✓ PostgreSQL started")
except Exception as e:
    print(f"Error: {e}")

import time
time.sleep(3)

print("\nStep 3: Resetting postgres user password to 'postgres'...")
try:
    subprocess.run([
        os.path.join(pg_bin, "psql.exe"),
        "-U", "postgres",
        "-d", "postgres",
        "-c", "ALTER USER postgres WITH PASSWORD 'postgres';"
    ], check=True)
    print("✓ Password reset to 'postgres'")
except Exception as e:
    print(f"Error resetting password: {e}")

print("\nStep 4: Restarting PostgreSQL normally...")
try:
    subprocess.run(["net", "start", "postgresql-x64-18"], check=True)
    print("✓ PostgreSQL restarted")
except Exception as e:
    print(f"Could not restart service: {e}")

print("\n" + "=" * 50)
print("Done! Try connecting with:")
print("  Username: postgres")
print("  Password: postgres")
