document.getElementById("launchBtn").addEventListener("click", launchSelectedSolutions);
document.getElementById("clearBtn").addEventListener("click", clearSelections);
document.getElementById("selectAllBtn").addEventListener("click", selectAllCheckboxes);

electron.ipcRenderer.send('get-solutions');

electron.ipcRenderer.on('receive-solutions', (solutions) => {
    const solutionsContainer = document.getElementById('solutionsContainer');
  
    solutions.forEach((solution) => {
      const formCheckDiv = document.createElement('div');
      formCheckDiv.classList.add('form-check');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('form-check-input');
      checkbox.id = solution.name.replace(/\s/g, ''); // Use this as a unique identifier
      checkbox.value = solution.path;
  
      const label = document.createElement('label');
      label.classList.add('form-check-label');
      label.htmlFor = checkbox.id;
      label.textContent = solution.name;
  
      formCheckDiv.appendChild(checkbox);
      formCheckDiv.appendChild(label);
  
      solutionsContainer.appendChild(formCheckDiv);
  
    //   solutionsContainer.appendChild(document.createElement('br'));
    });
  });
  

function launchSelectedSolutions() {
    const selectedSolutions = [];

    document.querySelectorAll('input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedSolutions.push(checkbox.value);
    });

    electron.ipcRenderer.send('launch-solutions', selectedSolutions);
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