/**
 * GitLab Token and Permissions Debug Script
 * Run this in your browser console while on the plugin page to debug GitLab issues
 */

async function debugGitLabSettings() {
  console.group("🔍 GitLab Debug Information");
  
  // Check if settings are loaded
  console.log("1. Settings Status:");
  console.log("   - window.gitlabSettings exists:", !!window.gitlabSettings);
  
  if (window.gitlabSettings) {
    console.log("   - Project ID:", window.gitlabSettings.projectId);
    console.log("   - Token exists:", !!window.gitlabSettings.gitlabToken);
    console.log("   - Token length:", window.gitlabSettings.gitlabToken?.length || 0);
    console.log("   - Save token setting:", window.gitlabSettings.saveToken);
    console.log("   - Branch name:", window.gitlabSettings.branchName);
    console.log("   - Branch strategy:", window.gitlabSettings.branchStrategy);
  }
  
  // Check hidden form fields
  console.log("\n2. Form Field Status:");
  const projectIdField = document.getElementById("gitlab-project-id");
  const tokenField = document.getElementById("gitlab-token");
  const branchField = document.getElementById("branch-name");
  
  console.log("   - Project ID field value:", projectIdField?.value || "Not found");
  console.log("   - Token field exists:", !!tokenField);
  console.log("   - Token field has value:", !!(tokenField?.value));
  console.log("   - Token field length:", tokenField?.value?.length || 0);
  console.log("   - Branch field value:", branchField?.value || "Not found");
  
  console.groupEnd();
  
  // If we have token and project ID, test GitLab API access
  const token = tokenField?.value || window.gitlabSettings?.gitlabToken;
  const projectId = projectIdField?.value || window.gitlabSettings?.projectId;
  
  if (token && projectId) {
    await testGitLabAccess(token, projectId);
  } else {
    console.warn("❌ Cannot test GitLab access - missing token or project ID");
  }
}

async function testGitLabAccess(token, projectId) {
  console.group("🌐 GitLab API Access Test");
  
  try {
    // Test 1: Get project info
    console.log("Testing project access...");
    const projectResponse = await fetch(`https://gitlab.fhnw.ch/api/v4/projects/${projectId}`, {
      headers: { "PRIVATE-TOKEN": token }
    });
    
    if (projectResponse.ok) {
      const project = await projectResponse.json();
      console.log("✅ Project access successful");
      console.log("   - Project name:", project.name);
      console.log("   - Default branch:", project.default_branch);
      console.log("   - Permissions:", project.permissions);
    } else {
      console.error("❌ Project access failed:", projectResponse.status, projectResponse.statusText);
    }
    
    // Test 2: Get user info
    console.log("\nTesting user permissions...");
    const userResponse = await fetch("https://gitlab.fhnw.ch/api/v4/user", {
      headers: { "PRIVATE-TOKEN": token }
    });
    
    if (userResponse.ok) {
      const user = await userResponse.json();
      console.log("✅ User authentication successful");
      console.log("   - Username:", user.username);
      console.log("   - Name:", user.name);
    } else {
      console.error("❌ User authentication failed:", userResponse.status, userResponse.statusText);
    }
    
    // Test 3: Check project members and permissions
    console.log("\nTesting project membership...");
    const memberResponse = await fetch(`https://gitlab.fhnw.ch/api/v4/projects/${projectId}/members/all`, {
      headers: { "PRIVATE-TOKEN": token }
    });
    
    if (memberResponse.ok) {
      const members = await memberResponse.json();
      console.log("✅ Project members accessible");
      console.log("   - Total members:", members.length);
      
      // Find current user
      const userResponse = await fetch("https://gitlab.fhnw.ch/api/v4/user", {
        headers: { "PRIVATE-TOKEN": token }
      });
      
      if (userResponse.ok) {
        const currentUser = await userResponse.json();
        const membership = members.find(m => m.id === currentUser.id);
        
        if (membership) {
          console.log("✅ User is project member");
          console.log("   - Access level:", membership.access_level);
          console.log("   - Role:", getAccessLevelName(membership.access_level));
        } else {
          console.warn("⚠️  User is not a direct project member");
        }
      }
    } else {
      console.error("❌ Cannot access project members:", memberResponse.status);
    }
    
    // Test 4: Check specific branch permissions
    const branchName = document.getElementById("branch-name")?.value || window.gitlabSettings?.branchName || "main";
    console.log(`\nTesting branch '${branchName}' access...`);
    
    const branchResponse = await fetch(`https://gitlab.fhnw.ch/api/v4/projects/${projectId}/repository/branches/${branchName}`, {
      headers: { "PRIVATE-TOKEN": token }
    });
    
    if (branchResponse.ok) {
      const branch = await branchResponse.json();
      console.log("✅ Branch accessible");
      console.log("   - Protected:", branch.protected);
      console.log("   - Can push:", branch.can_push);
      console.log("   - Developers can push:", branch.developers_can_push);
      console.log("   - Developers can merge:", branch.developers_can_merge);
      
      if (branch.protected && !branch.can_push) {
        console.warn("⚠️  Branch is protected and you cannot push to it");
        console.warn("   This is likely the cause of the 403 error");
      }
    } else {
      console.error("❌ Branch access failed:", branchResponse.status);
      if (branchResponse.status === 404) {
        console.warn("   Branch might not exist - this could be intentional for feature branches");
      }
    }
    
  } catch (error) {
    console.error("❌ GitLab API test failed:", error.message);
  }
  
  console.groupEnd();
}

function getAccessLevelName(level) {
  const levels = {
    10: "Guest",
    20: "Reporter", 
    30: "Developer",
    40: "Maintainer",
    50: "Owner"
  };
  return levels[level] || `Unknown (${level})`;
}

// Auto-run debug when script is loaded
console.log("🔧 GitLab Debug Script Loaded");
console.log("Run debugGitLabSettings() to check your configuration");

// Add button to UI for easy debugging
function addDebugButton() {
  const button = document.createElement('button');
  button.textContent = 'Debug GitLab Settings';
  button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: #ff6b6b; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;';
  button.onclick = debugGitLabSettings;
  document.body.appendChild(button);
}

// Add debug button after a short delay
setTimeout(addDebugButton, 1000);