      function openGitLabModal() {
        document.getElementById("gitlab-modal").style.display = "block";

        // Load saved settings from configuration tab
        if (window.gitlabSettings) {
          // Fill in the hidden fields with stored config values
          if (window.gitlabSettings.projectId) {
            document.getElementById("gitlab-project-id").value = window.gitlabSettings.projectId;
          }

          if (window.gitlabSettings.gitlabToken) {
            document.getElementById("gitlab-token").value = window.gitlabSettings.gitlabToken;
          }
          
          // Handle branch settings based on strategy
          let displayBranchName = window.gitlabSettings.branchName || "main";
          
          // If using feature branch strategy, create a feature branch name
          if (window.gitlabSettings.branchStrategy === "feature") {
            const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 12);
            const commitMsg = document.getElementById("commit-message").value.trim();
            const branchBase = commitMsg
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .substring(0, 20);
            const prefix = window.gitlabSettings.featurePrefix || "feature/";
            
            // Set the branch name for commit
            displayBranchName = `${prefix}${branchBase}-${timestamp}`;
            document.getElementById("branch-name").value = displayBranchName;
          } else {
            // Using default branch
            document.getElementById("branch-name").value = window.gitlabSettings.branchName || "main";
          }
          
          // Display the branch name in the UI
          document.getElementById("target-branch-display").textContent = displayBranchName;

          // Set default file path
          document.getElementById("file-path").value = window.gitlabSettings.filePath || "src/variables.css";
        } else {
          // Display default branch if no settings
          document.getElementById("target-branch-display").textContent = "main";
        }
      }