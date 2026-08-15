$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Chatbot AI.lnk")
$Shortcut.TargetPath = "C:\Users\afina\my-video\chatbot\start-advanced.bat"
$Shortcut.WorkingDirectory = "C:\Users\afina\my-video\chatbot"
$Shortcut.Description = "Chatbot AI Advanced - Buka chatbot AI dengan fitur modern"
$Shortcut.Save()