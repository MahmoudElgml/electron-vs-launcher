const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");
const { exec, spawn } = require("child_process");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 1024,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.loadFile("index.html");
};
app.whenReady().then(() => {
  ipcMain.handle("ping", () => "pong");
  createWindow();
});

ipcMain.on("launch-solutions", (event, selectedSolutions) => {
  selectedSolutions.forEach((path) => {
    launchVisualStudioSolution(path);
  });
});

ipcMain.on("update-db", (event, migratorPath) => {
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
});

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

ipcMain.on("get-solutions", (event) => {
  const configPath = path.join(__dirname, "config.json");
  fs.readFile(configPath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading config file:", err);
      return;
    }

    const config = JSON.parse(data);
    event.sender.send("receive-solutions", config.solutions);
  });
});

ipcMain.on("get-latest", (event, solutionPath) => {
  let pathArray = solutionPath.split("\\");
  let name = pathArray[pathArray.length - 1];
  pathArray.pop();
  let pathWithoutFileName = pathArray.join("\\");
  exec(
    `cd ${pathWithoutFileName} && git checkout master_dev && git pull`,
    (error, stdout, stderr) => {
      if (error) {
        event.reply("get-latest-result", {
          success: false,
          error: error.message + `${name}`,
        });
        return;
      }
      event.reply("get-latest-result", {
        success: true,
        output: `${name} ` + stdout,
      });
    }
  );
});
