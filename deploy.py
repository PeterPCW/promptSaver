import os
# import shutil
import time
import msvcrt

# Build the React app - includes eslint and jest per package.json
os.system("npm run build")

# Wait for user input to write the commit message, use default after 30s
def get_commit_message(timeout=30):
    start_time = time.time()
    message = ""
    while True:
        if msvcrt.kbhit():  # Check if a key has been pressed
            char = msvcrt.getwche()  # Read a character without waiting for a newline
            if char == '\r':  # If the Enter key was pressed, exit the loop
                break
            message += char  # Append the character to the message
        elif time.time() - start_time > timeout:  # If the timeout has elapsed, exit the loop
            break
    if not message:
        message = "commit from deploy"  # Use default message if no input was received
    return message

print('Enter a commit message (optional, 30s timeout for "commit from deploy", careful no backspace!):')
commit_message = get_commit_message()
os.system(f'git add . && git commit -m "{commit_message}" && git push')