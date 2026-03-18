#!/usr/bin/env python3
"""Fork a new terminal window with a command.

Usage: python3 fork_terminal.py <command...>

Supports macOS (Terminal.app via AppleScript) and Windows (cmd).
"""

import os
import platform
import subprocess
import sys


def fork_terminal(command: str) -> str:
    """Open a new terminal window and run the specified command."""
    system = platform.system()
    cwd = os.getcwd()

    if system == "Darwin":
        shell_command = f"cd '{cwd}' && {command}"
        escaped = shell_command.replace("\\", "\\\\").replace('"', '\\"')
        try:
            result = subprocess.run(
                ["osascript", "-e", f'tell application "Terminal" to do script "{escaped}"'],
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                return f"Error: {result.stderr.strip()}"
            return f"Terminal forked successfully"
        except Exception as e:
            return f"Error: {e}"

    elif system == "Windows":
        full_command = f'cd /d "{cwd}" && {command}'
        subprocess.Popen(["cmd", "/c", "start", "cmd", "/k", full_command], shell=True)
        return "Terminal forked successfully"

    else:
        return f"Error: platform {system} not supported (macOS and Windows only)"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: fork_terminal.py <command...>", file=sys.stderr)
        sys.exit(1)
    result = fork_terminal(" ".join(sys.argv[1:]))
    print(result)
