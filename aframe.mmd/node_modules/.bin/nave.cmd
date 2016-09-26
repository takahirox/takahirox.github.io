@IF EXIST "%~dp0\/bin/bash.exe" (
  "%~dp0\/bin/bash.exe"  "%~dp0\..\nave\nave.sh" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  /bin/bash  "%~dp0\..\nave\nave.sh" %*
)