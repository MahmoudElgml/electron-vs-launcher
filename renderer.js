const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");

document
  .getElementById("launchBtn")
  .addEventListener("click", launchSelectedSolutions);
document.getElementById("clearBtn").addEventListener("click", clearSelections);
document
  .getElementById("selectAllBtn")
  .addEventListener("click", selectAllCheckboxes);

function launchSelectedSolutions() {
  const selectedSolutions = [];

  document
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      launchVisualStudioSolution(checkbox.value);
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

function launchVisualStudioSolution(solutionPath) {
  const devenvPath =
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\IDE\\devenv.exe";
  if (fs.existsSync(devenvPath)) {
    const args = [solutionPath];
    const withoutDebugConfig = "Debug.StartWithoutDebugging";
    args.push(`/Command`, withoutDebugConfig);

    const options = { windowsHide: false };
    const child = spawn("devenv", args, options);

    child.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on("close", (code) => {
      console.log(`Child process exited with code ${code}`);
    });

    child.on("error", (err) => {
      console.error("Error launching Visual Studio:", err);
    });
  } else {
    console.error("Visual Studio not found at the specified path.");
  }
}

function getLatest(solutionPath,rootPath) {
  let pathArray = solutionPath.split("\\");
  let name = pathArray[pathArray.length - 1];
  pathArray.pop();
  let pathWithoutFileName = pathArray.join("\\");

  pathWithoutFileName=path.join(rootPath, pathWithoutFileName)
  exec(
    `cd ${pathWithoutFileName} && git checkout master_dev && git pull`,
    (error, stdout, stderr) => {
      if (error) {
        showNotification(
          "Error getting latest:",
          error.message + `${name}`,
          "error"
        );
        return;
      }
      showNotification("Get Latest Successful", `${name} ` + stdout, "success");
    }
  );
}

function showNotification(title, message, state) {
  const NOTIFICATION_TITLE = title;
  const NOTIFICATION_BODY = message;
  const CLICK_MESSAGE = "click to show";
  var ICON = "";

  if (state == "success") {
    ICON = "check.png";
  } else {
    ICON = "close.png";
  }
  new window.Notification(NOTIFICATION_TITLE, {
    body: NOTIFICATION_BODY,
    icon: ICON,
    renotify: false,
  }).onclick = () => {
    document.getElementById("output").innerText = CLICK_MESSAGE;
  };
}

function updateDb(migratorPath) {
  const args = ["run"];
  args.push(`--project`, migratorPath);

  const options = { shell: true, detached: true, stdio: "inherit" };
  const child = spawn("cmd.exe", ["/k", "dotnet", ...args], options);

  child.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
  });

  child.on("error", (err) => {
    console.error("Error Running Migration:", err);
  });
}

function loadSolutionsFromConfig(solutions,rootPath) {
  const solutionsContainer = document.getElementById("solutionsContainer");

  const table = document.createElement("table");
  table.classList.add("table", "table-striped", "table-hover", "align-middle");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const nameHeader = document.createElement("th");
  nameHeader.textContent = "Solution Name";

  const actionsHeader = document.createElement("th");
  actionsHeader.textContent = "Actions";

  headerRow.appendChild(nameHeader);
  headerRow.appendChild(actionsHeader);
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");

  solutions.forEach((solution) => {
    const row = document.createElement("tr");

    const checkboxTd = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("form-check-input");
    checkbox.id = solution.name.replace(/\s/g, "");
    checkbox.value = path.join(rootPath, solution.path);

    const label = document.createElement("label");
    label.classList.add("form-check-label", "ms-2");
    label.htmlFor = checkbox.id;
    label.textContent = solution.name;

    checkboxTd.appendChild(checkbox);
    checkboxTd.appendChild(label);

    const actionsTd = document.createElement("td");

    const getLatestButton = document.createElement("button");
    getLatestButton.classList.add("btn", "btn-secondary", "btn-sm", "me-2");
    getLatestButton.innerHTML = '<i class="fa fa-solid fa-download"></i>';
    getLatestButton.onclick = () => getLatest(solution.path,rootPath);

    actionsTd.appendChild(getLatestButton);

    if (solution?.migratorPath != null) {
      const updateDbEl = document.createElement("button");
      updateDbEl.classList.add("btn", "btn-warning", "btn-sm", "ms-1");
      updateDbEl.textContent = "Update DB";
      updateDbEl.onclick = () => updateDb(path.join(rootPath, solution.migratorPath));
      actionsTd.appendChild(updateDbEl);
    }

    // Add Dockerize button
    const dockerizeButton = document.createElement("button");
    dockerizeButton.classList.add("btn", "btn-primary", "btn-sm", "ms-1");
    dockerizeButton.textContent = "Dockerize";
    dockerizeButton.onclick = () => dockerizeApp(solution,rootPath);

    actionsTd.appendChild(dockerizeButton);

    row.appendChild(checkboxTd);
    row.appendChild(actionsTd);

    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  solutionsContainer.appendChild(table);
}

function dockerizeApp(solution, rootPath) {
  const dockerFilePath = path.join(rootPath, solution.dockerContextFolder, "dev-dockerfile");
  const dockerBuildCommand = `docker buildx build --pull --rm -t ${solution.imageContainerName}:latest -f ${dockerFilePath} ${path.join(rootPath, solution.dockerContextFolder)}`;
  const dockerRunCommand = `docker run -d -p ${solution.dockerPort}:${solution.dockerPort} --name ${solution.imageContainerName} ${solution.imageContainerName}`;
  const dockerPruneCommand = `docker image prune -f`;

  const buildOptions = { shell: true, detached: true, stdio: 'inherit' };
  const buildProcess = spawn('cmd.exe', ['/k', dockerBuildCommand], buildOptions);

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Error building Docker image for ${solution.name}. Exit code: ${code}`);
      return;
    }

    console.log(`Docker image built for ${solution.name}.`);

    const runProcess = spawn('cmd.exe', ['/k', dockerRunCommand], buildOptions);

    runProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Error running Docker container for ${solution.name}. Exit code: ${code}`);
        return;
      }

      console.log(`Docker container running for ${solution.name}.`);

      const pruneProcess = spawn('cmd.exe', ['/k', dockerPruneCommand], buildOptions);

      pruneProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Error removing dangling images. Exit code: ${code}`);
          return;
        }

        console.log(`Dangling images removed.`);
      });
    });
  });
}



function loadSolutions() {
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading config file:", err);
      return;
    }
    const config = JSON.parse(data);
    loadSolutionsFromConfig(config.solutions, config.rootPath);
  });
}

loadSolutions();
