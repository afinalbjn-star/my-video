@echo off
echo Creating shortcut for Chatbot AI...

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Chatbot AI.lnk'); $Shortcut.TargetPath = 'C:\Users\afina\my-video\chatbot\start-advanced.bat'; $Shortcut.WorkingDirectory = 'C:\Users\afina\my-video\chatbot'; $Shortcut.Description = 'Chatbot AI Advanced'; $Shortcut.Save()"

echo Shortcut created successfully!
echo You can now find "Chatbot AI" on your desktop.
pause