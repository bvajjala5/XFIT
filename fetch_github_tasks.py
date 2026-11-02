import os
import subprocess
import json

# Your authenticated GitHub CLI credentials token
GH_TOKEN = os.environ.get("GH_TOKEN")
REPO = "bvajjala5/XFIT"

def fetch_active_issues():
    print(f"Checking for workspace items in {REPO}...")
    # Configure the environment safely for the execution block
    env = os.environ.copy()
    env["GH_TOKEN"] = GH_TOKEN
    
    try:
        # Call the authenticated GitHub API wrapper directly
        result = subprocess.run(
            ["gh", "issue", "list", "-R", REPO, "--json", "number,title,body"],
            capture_output=True, text=True, env=env, check=True
        )
        issues = json.loads(result.stdout)
        if not issues:
            print("No open issues or manual task items found.")
            return
            
        print("\n--- Active Repository Issues & Tasks ---")
        for issue in issues:
            print(f"#{issue['number']}: {issue['title']}")
            print(f"Description: {issue['body']}\n")
    except Exception as e:
        print(f"Authentication or pipeline execution error: {e}")

if __name__ == "__main__":
    fetch_active_issues()

