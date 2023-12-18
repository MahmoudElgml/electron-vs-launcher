document
  .getElementById("launchBtn")
  .addEventListener("click", launchSelectedSolutions);
document.getElementById("clearBtn").addEventListener("click", clearSelections);
document
  .getElementById("selectAllBtn")
  .addEventListener("click", selectAllCheckboxes);

electron.ipcRenderer.send("get-solutions");

electron.ipcRenderer.on("receive-solutions", (solutions) => {
    const solutionsContainer = document.getElementById("solutionsContainer");
  
    solutions.forEach((solution) => {
      // Create a Bootstrap form-check div
      const formCheckDiv = document.createElement("div");
      formCheckDiv.classList.add("form-check");
  
      // Create the checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("form-check-input");
      checkbox.id = solution.name.replace(/\s/g, ""); // Use this as a unique identifier
      checkbox.value = solution.path;
  
      // Create the label
      const label = document.createElement("label");
      label.classList.add("form-check-label");
      label.htmlFor = checkbox.id;
      label.textContent = solution.name;
  
      // Create "Get Latest" button with icon
      const getLatestButton = document.createElement("button");
      getLatestButton.classList.add("btn", "btn-info", "ms-3");
      getLatestButton.innerHTML = '<i class="fa fa-solid fa-download"></i>'; // Icon instead of text
      getLatestButton.onclick = () => getLatest(solution.path); // Attach a click event
  
      // Append elements to the form-check div
      formCheckDiv.appendChild(checkbox);
      formCheckDiv.appendChild(label);
      formCheckDiv.appendChild(getLatestButton);
  
      // Append the form-check div to the solutions container
      solutionsContainer.appendChild(formCheckDiv);
  
      // Add a line break for spacing
      solutionsContainer.appendChild(document.createElement("hr"));
    });
  });
  
// Function to perform Git operations (dummy function for demonstration)
function getLatest(solutionPath) {
    electron.ipcRenderer.send('get-latest', solutionPath);
  
    // Optionally, handle the result when it's received
    electron.ipcRenderer.once('get-latest-result', (result) => {
      if (result.success) {
        console.log('Get Latest successful:', result.output);
      } else {
        console.error('Error getting latest:', result.error);
      }
    });
  }

function launchSelectedSolutions() {
  const selectedSolutions = [];

  document
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      selectedSolutions.push(checkbox.value);
    });

  electron.ipcRenderer.send("launch-solutions", selectedSolutions);
}

function clearSelections() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });
}

function selectAllCheckboxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });
}
