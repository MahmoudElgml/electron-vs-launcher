const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const rootPathGlobal=''
document
  .getElementById("launchBtnForIDE")
  .addEventListener("click", launchSelectedSolutionsSafely);

  document
  .getElementById("launchBtnForCLI")
  .addEventListener("click", launchSelectedSolutionsOnCLI);


document.getElementById("clearBtn").addEventListener("click", clearSelections);
document
  .getElementById("selectAllBtn")
  .addEventListener("click", selectAllCheckboxes);
document.getElementById('get-latest-selected').addEventListener('click', getLatestFromSelected);

const riderPath = "/Applications/Rider.app/Contents/MacOS/rider";

// Check if Rider is already running
function isRiderRunning(callback) {
  const ps = spawn("pgrep", ["-f", "Rider"]);
  ps.on("close", (code) => {
    callback(code === 0); // 0 = found process
  });
}

// Launch Rider without a project to ensure it's initialized
function preWarmRider() {
  const child = spawn(riderPath, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

// Launch a single solution in Rider
function launchSolution(solutionPath) {
  if (!fs.existsSync(solutionPath)) {
    console.error(`Solution path does not exist: ${solutionPath}`);
    return;
  }

  const args = [solutionPath];

  const options = {
    detached: true,
    stdio: "ignore"
  };

  const child = spawn(riderPath, args, options);
  child.unref();

  console.log(`Launched Rider for: ${solutionPath}`);
}

// Launch selected checkboxes
function launchSelectedSolutions() {
  document
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      launchSolution(checkbox.value);
    });
}


// Launch selected checkboxes
function launchSelectedSolutionsOnCLI() {
  document
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      launchOnCLI(checkbox.data);
    });
}

// Entry point — ensures Rider is warmed before launching projects
function launchSelectedSolutionsSafely() {
  isRiderRunning((running) => {
    if (!running) {
      console.log("Rider is not running. Launching in background...");
      preWarmRider();

      // Wait 3 seconds to allow it to boot up before launching solutions
      setTimeout(() => {
        launchSelectedSolutions();
      }, 3000);
    } else {
      console.log("Rider is already running. Launching solutions immediately.");
      launchSelectedSolutions();
    }
  });
}


function getLatestFromSelected() {
  document
  .querySelectorAll('input[type="checkbox"]:checked')
  .forEach((checkbox) => {
    getLatest(checkbox.value,rootPathGlobal);

  });
}


function warmUpRider() {
  const riderPath = "/Applications/Rider.app/Contents/MacOS/rider";

  const child = spawn(riderPath, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
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


function getLatest(solutionPath, rootPath) {
  let pathArray = solutionPath.split("/");
  let name = pathArray[pathArray.length - 1];
  pathArray.pop();
  let pathWithoutFileName = pathArray.join("/");

  pathWithoutFileName = path.join(rootPath, pathWithoutFileName);
  exec(
    `cd "${pathWithoutFileName}" && git checkout master_dev && git pull`,
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

function updateDb(migratorRelativePath) {
  const dotnetPath = "/usr/local/share/dotnet/dotnet";
  const migratorProjectPath = path.resolve(__dirname, migratorRelativePath);

  if (!fs.existsSync(dotnetPath) || fs.lstatSync(dotnetPath).isDirectory()) {
    console.error("❌ Invalid dotnet path: not a file or does not exist");
    return;
  }
  if (!fs.existsSync(migratorProjectPath) || fs.lstatSync(migratorProjectPath).isDirectory()) {
    console.error("❌ Invalid migrator project path. Expected a .csproj file.");
    return;
  }

  // AppleScript to open Terminal and run the command
  const command = `"${dotnetPath}" run --project "${migratorProjectPath}"; echo; echo 'Press any key to exit...'; read -n 1`;
  const osaScript = [
    'tell application "Terminal"',
    `do script "${command.replace(/(["\\$`])/g, '\\$1')}"`,
    'activate',
    'end tell'
  ].join('\n');

  spawn('osascript', ['-e', osaScript], {
    detached: true,
    stdio: "ignore"
  }).unref();
}




function launchOnCLI(startupProject) {
  const dotnetPath = "/usr/local/share/dotnet/dotnet";
  const startupProjectPath = path.resolve(__dirname, startupProject);

  if (!fs.existsSync(dotnetPath) || fs.lstatSync(dotnetPath).isDirectory()) {
    console.error("❌ Invalid dotnet path: not a file or does not exist");
    return;
  }
  if (!fs.existsSync(startupProjectPath) || fs.lstatSync(startupProjectPath).isDirectory()) {
    console.error("❌ Invalid migrator project path. Expected a .csproj file.");
    return;
  }

  // AppleScript to open Terminal and run the command
  const command = `"${dotnetPath}" run --project "${startupProjectPath}"; echo; echo 'Press any key to exit...'; read -n 1`;
  const osaScript = [
    'tell application "Terminal"',
    `do script "${command.replace(/(["\\$`])/g, '\\$1')}"`,
    'activate',
    'end tell'
  ].join('\n');

  spawn('osascript', ['-e', osaScript], {
    detached: true,
    stdio: "ignore"
  }).unref();
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
    checkbox.value = path.join(rootPath, solution.solutionPath);
    checkbox.data = path.join(rootPath, solution.startupProject);


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
    getLatestButton.onclick = () => getLatest(solution.solutionPath,rootPath);

    actionsTd.appendChild(getLatestButton);

    if (solution?.migratorPath != null) {
      const updateDbEl = document.createElement("button");
      updateDbEl.classList.add("btn", "btn-warning", "btn-sm", "ms-1");
      updateDbEl.textContent = "Update DB";
      updateDbEl.onclick = () => updateDb(path.join(rootPath, solution.migratorPath));
      actionsTd.appendChild(updateDbEl);
    }


    if (solution?.startupProject != null) {
      const runInConsoleEl = document.createElement("button");
      runInConsoleEl.classList.add("btn", "btn-success", "btn-sm", "ms-1");
      runInConsoleEl.textContent = "Run In Console";
      runInConsoleEl.onclick = () => launchOnCLI(path.join(rootPath, solution.startupProject));
      actionsTd.appendChild(runInConsoleEl);
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
  const dockerFilePath = path.join(rootPath, solution.contextFolder, "dev-dockerfile");
  const dockerBuildCommand = `docker buildx build --pull --rm -t ${solution.imageContainerName}:latest -f ${dockerFilePath} ${path.join(rootPath, solution.contextFolder)}`;
  const dockerRunCommand = `docker run -d -p ${solution.dockerPort}:${solution.dockerPort} --name ${solution.imageContainerName} ${solution.imageContainerName}`;
  const dockerPruneCommand = `docker image prune -f`;

  const buildOptions = { shell: true, stdio: 'inherit' };
  const buildProcess = spawn('/bin/bash', ['-c', dockerBuildCommand], buildOptions);

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Error building Docker image for ${solution.name}. Exit code: ${code}`);
      return;
    }

    console.log(`Docker image built for ${solution.name}.`);

    const runProcess = spawn('/bin/bash', ['-c', dockerRunCommand], buildOptions);

    runProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Error running Docker container for ${solution.name}. Exit code: ${code}`);
        return;
      }

      console.log(`Docker container running for ${solution.name}.`);

      const pruneProcess = spawn('/bin/bash', ['-c', dockerPruneCommand], buildOptions);

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
    this.rootPathGlobal=config.rootPath
    loadSolutionsFromConfig(config.solutions, config.rootPath);
  });
}

loadSolutions();
