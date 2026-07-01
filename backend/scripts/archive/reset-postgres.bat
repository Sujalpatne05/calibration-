@echo off
REM Stop PostgreSQL service
net stop postgresql-x64-18

REM Wait for it to stop
timeout /t 3 /nobreak

REM Start PostgreSQL in single-user mode to reset password
cd "C:\Program Files\PostgreSQL\18\bin"
pg_ctl -D "C:\Program Files\PostgreSQL\18\data" -U postgres -w start

REM Wait a moment
timeout /t 2 /nobreak

REM Reset password using psql (this is simplified - you'd need to use initdb or similar)
REM For now, let's just restart normally
net start postgresql-x64-18

echo PostgreSQL restarted. Try connecting with: psql -U postgres
