const cwdInput = document.getElementById('cwd');
const pickButton = document.getElementById('pick');
const runButton = document.getElementById('run');
const stopButton = document.getElementById('stop');
const cmdSelect = document.getElementById('cmd');
const logs = document.getElementById('logs');
const status = document.getElementById('status');

function appendLog(text) {
  logs.textContent += text;
  logs.scrollTop = logs.scrollHeight;
}

pickButton.addEventListener('click', async () => {
  const folder = await window.deploidStudio.chooseProject();
  if (folder) cwdInput.value = folder;
});

runButton.addEventListener('click', async () => {
  const cwd = cwdInput.value.trim();
  if (!cwd) {
    appendLog('Select a project folder first.\n');
    return;
  }
  const command = cmdSelect.value;
  try {
    await window.deploidStudio.runCommand(cwd, command);
  } catch (error) {
    appendLog(`Error: ${error.message}\n`);
  }
});

stopButton.addEventListener('click', async () => {
  await window.deploidStudio.stopCommand();
});

window.deploidStudio.onLog((entry) => {
  appendLog(entry.message);
});

window.deploidStudio.onState((state) => {
  status.textContent = state.running ? 'Running...' : 'Idle';
  runButton.disabled = state.running;
});
