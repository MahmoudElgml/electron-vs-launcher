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
    getLatestButton.classList.add(
      "btn",
      "btn-secondary",
      "ms-3",
      "btn-sm"
    );
    getLatestButton.innerHTML =
      '<i class="fa fa-solid fa-download data-toggle="tooltip" data-placement="top" title="Get Latest""></i>'; // Icon instead of text
    getLatestButton.onclick = () => getLatest(solution.path); // Attach a click event

    // Append elements to the form-check div
    formCheckDiv.appendChild(checkbox);
    formCheckDiv.appendChild(label);
    formCheckDiv.appendChild(getLatestButton);

    if (solution?.migratorPath != null) {
      const updateDbEl = document.createElement("button"); 
      updateDbEl.classList.add(
        "btn",
        "btn-warning",
        "ms-3",
        "btn-sm"
      );
      updateDbEl.innerHTML='Update DB'
      updateDbEl.onclick = () => updateDb(solution.migratorPath);
      formCheckDiv.appendChild(updateDbEl);
    }
    solutionsContainer.appendChild(formCheckDiv);

    const hr = document.createElement("hr");
    hr.classList.add("my-1");
    solutionsContainer.appendChild(hr);
  });
});

function getLatest(solutionPath) {
  electron.ipcRenderer.send("get-latest", solutionPath);

  electron.ipcRenderer.once("get-latest-result", (result) => {
    if (result.success) {
      console.log("Get Latest successful:", result.output);
      showNotification('Get Latest Successful', result.output,'success');
    } else {
      showNotification("Error getting latest:", result.error,'error');
    }
  });
}

function updateDb(migratorPath){
  electron.ipcRenderer.send("update-db", migratorPath);
  
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

function showNotification(title, message,state) {
  const NOTIFICATION_TITLE = title
  const NOTIFICATION_BODY = message
  const CLICK_MESSAGE = "click to show"
  var ICON=''
  
  if(state=='success'){
    ICON="check.png"
  }else{
    ICON="close.png"
  }
  new window.Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY,icon:ICON,renotify:false})
    .onclick = () => { document.getElementById('output').innerText = CLICK_MESSAGE }
}



