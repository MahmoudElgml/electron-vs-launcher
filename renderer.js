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
      launchOnCLI(checkbox.data, checkbox._category, checkbox._npmScript);
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
    getLatest(checkbox.value, rootPathGlobal);
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
  const normalized = path.isAbsolute(solutionPath)
    ? solutionPath
    : path.join(rootPath, solutionPath);

  if (!fs.existsSync(normalized)) {
    showNotification(
      "Error getting latest:",
      `Path does not exist: ${normalized}`,
      "error"
    );
    return;
  }

  const st = fs.statSync(normalized);
  const pathWithoutFileName = st.isDirectory()
    ? normalized
    : path.dirname(normalized);
  const name = path.basename(normalized);

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




function launchOnCLI(startupProject, category, npmScript) {
  const startupProjectPath = path.resolve(startupProject);
  const cat = category || "dotnet";

  if (cat === "node") {
    if (!fs.existsSync(startupProjectPath) || !fs.statSync(startupProjectPath).isDirectory()) {
      console.error("❌ Node projects expect startupProject to be an existing directory.");
      return;
    }
    const script = npmScript || "start";
    const command = `cd "${startupProjectPath}" && npm run ${script}; echo; echo 'Press any key to exit...'; read -n 1`;
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
    return;
  }

  const dotnetPath = "/usr/local/share/dotnet/dotnet";

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


function createSolutionsTable(solutions, rootPath) {
  const tableWrapper = document.createElement("div");
  tableWrapper.classList.add("table-responsive");

  const table = document.createElement("table");
  table.classList.add("table", "table-striped", "table-hover", "align-middle");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const nameHeader = document.createElement("th");
  nameHeader.textContent = "Solution Name";
  nameHeader.classList.add("text-nowrap");

  const getLatestHeader = document.createElement("th");
  getLatestHeader.textContent = "Get Latest";
  getLatestHeader.classList.add("text-nowrap");

  const updateDbHeader = document.createElement("th");
  updateDbHeader.textContent = "Update DB";
  updateDbHeader.classList.add("text-nowrap");

  const runInConsoleHeader = document.createElement("th");
  runInConsoleHeader.textContent = "Run In Console";
  runInConsoleHeader.classList.add("text-nowrap");

  const dockerizeHeader = document.createElement("th");
  dockerizeHeader.textContent = "Dockerize";
  dockerizeHeader.classList.add("text-nowrap");

  headerRow.appendChild(nameHeader);
  headerRow.appendChild(getLatestHeader);
  headerRow.appendChild(updateDbHeader);
  headerRow.appendChild(runInConsoleHeader);
  headerRow.appendChild(dockerizeHeader);
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
    checkbox._category = solution.category || "dotnet";
    checkbox._npmScript = solution.npmScript || "start";


    const label = document.createElement("label");
    label.classList.add("form-check-label", "ms-2");
    label.htmlFor = checkbox.id;
    label.textContent = solution.name;

    checkboxTd.appendChild(checkbox);
    checkboxTd.appendChild(label);
    checkboxTd.classList.add("text-nowrap");

    // Get Latest button column
    const getLatestTd = document.createElement("td");
    getLatestTd.classList.add("text-nowrap");
    const getLatestButton = document.createElement("button");
    getLatestButton.classList.add("btn", "btn-secondary", "btn-sm");
    getLatestButton.innerHTML = '<i class="fa fa-solid fa-download"></i>';
    getLatestButton.onclick = () => getLatest(solution.solutionPath,rootPath);
    getLatestTd.appendChild(getLatestButton);

    // Update DB button column
    const updateDbTd = document.createElement("td");
    updateDbTd.classList.add("text-nowrap");
    if (solution?.migratorPath != null) {
      const updateDbEl = document.createElement("button");
      updateDbEl.classList.add("btn", "btn-warning", "btn-sm");
      updateDbEl.textContent = "Update DB";
      updateDbEl.onclick = () => updateDb(path.join(rootPath, solution.migratorPath));
      updateDbTd.appendChild(updateDbEl);
    }

    // Run In Console button column
    const runInConsoleTd = document.createElement("td");
    runInConsoleTd.classList.add("text-nowrap");
    if (solution?.startupProject != null) {
      const runInConsoleEl = document.createElement("button");
      runInConsoleEl.classList.add("btn", "btn-success", "btn-sm");
      runInConsoleEl.textContent = "Run In Console";
      runInConsoleEl.onclick = () =>
        launchOnCLI(
          path.join(rootPath, solution.startupProject),
          solution.category,
          solution.npmScript
        );
      runInConsoleTd.appendChild(runInConsoleEl);
    }

    // Dockerize button column
    const dockerizeTd = document.createElement("td");
    dockerizeTd.classList.add("text-nowrap");
    if (solution.contextFolder) {
      const dockerizeButton = document.createElement("button");
      dockerizeButton.classList.add("btn", "btn-primary", "btn-sm");
      dockerizeButton.textContent = "Dockerize";
      dockerizeButton.onclick = () => dockerizeApp(solution, rootPath);
      dockerizeTd.appendChild(dockerizeButton);
    }

    row.appendChild(checkboxTd);
    row.appendChild(getLatestTd);
    row.appendChild(updateDbTd);
    row.appendChild(runInConsoleTd);
    row.appendChild(dockerizeTd);

    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableWrapper.appendChild(table);
  return tableWrapper;
}

function loadSolutionsFromConfig(config) {
  const solutionsContainer = document.getElementById("solutionsContainer");
  solutionsContainer.replaceChildren();

  const rootPath = config.rootPath;

  let sectionsToRender = [];
  if (Array.isArray(config.sections) && config.sections.length > 0) {
    sectionsToRender = config.sections.filter(
      (s) => s.solutions && s.solutions.length > 0
    );
  } else if (Array.isArray(config.solutions) && config.solutions.length > 0) {
    sectionsToRender = [{ title: "Solutions", solutions: config.solutions }];
  }

  if (sectionsToRender.length === 0) {
    return;
  }

  const accordion = document.createElement("div");
  accordion.className = "accordion app-accordion";
  accordion.id = "solutionsAccordion";

  sectionsToRender.forEach((section, index) => {
    const collapseId = `section-collapse-${index}`;
    const headingId = `section-heading-${index}`;

    const item = document.createElement("div");
    item.className = "accordion-item";

    const headerWrap = document.createElement("h2");
    headerWrap.className = "accordion-header";
    headerWrap.id = headingId;

    const isOpen = index === 0;
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = isOpen
      ? "accordion-button"
      : "accordion-button collapsed";
    toggleBtn.setAttribute("data-bs-toggle", "collapse");
    toggleBtn.setAttribute("data-bs-target", "#" + collapseId);
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    toggleBtn.setAttribute("aria-controls", collapseId);
    toggleBtn.textContent = section.title || "Solutions";

    headerWrap.appendChild(toggleBtn);

    const collapse = document.createElement("div");
    collapse.id = collapseId;
    collapse.className = isOpen
      ? "accordion-collapse collapse show"
      : "accordion-collapse collapse";
    collapse.setAttribute("data-bs-parent", "#solutionsAccordion");

    const body = document.createElement("div");
    body.className = "accordion-body";

    const toolbar = document.createElement("div");
    toolbar.className = "d-flex justify-content-end mb-2";
    const selectSectionBtn = document.createElement("button");
    selectSectionBtn.type = "button";
    selectSectionBtn.className = "btn btn-outline-primary btn-sm";
    selectSectionBtn.innerHTML =
      '<i class="fa fa-check-square-o me-1"></i> Select all in section';
    selectSectionBtn.addEventListener("click", () => {
      body.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = true;
      });
    });
    toolbar.appendChild(selectSectionBtn);
    body.appendChild(toolbar);
    body.appendChild(createSolutionsTable(section.solutions, rootPath));

    collapse.appendChild(body);
    item.appendChild(headerWrap);
    item.appendChild(collapse);
    accordion.appendChild(item);
  });

  solutionsContainer.appendChild(accordion);
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
    this.rootPathGlobal = config.rootPath;
    loadSolutionsFromConfig(config);
  });
}

loadSolutions();
