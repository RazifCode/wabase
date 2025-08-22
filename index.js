const { spawn } = require("child_process");
const chalk = require("chalk");
/*
console.clear();


require("cfonts").say("WaBase", {
    font: "block",
    align: "center",
    colors: ["cyan", "blue"],
    background: "transparent",
    letterSpacing: 1,
    lineHeight: 1,
    maxLenght: "0"
});
padam aja /**/ kalau mau guna cfonts
*/
console.log(chalk.green("Welcome To Bot Wa"));

let isRunning = false;
function start(file) {
    if (isRunning) return;
    isRunning = true;
    const args = [file, ...process.argv.slice(2)];
    const p = spawn(process.argv[0], args, {
        stdio: ["inherit", "inherit", "inherit", "ipc"]
    });

    p.on("message", data => {
        console.log(chalk.yellow("message: " + data));
        if (data == "restart") {
            p.kill();
            isRunning = false;
            start(file);
        }
    });

    p.on("exit", code => {
        isRunning = false;
        console.log(chalk.red(`Exited with code: ${code}`));
        if (code) start(file);
    });

    p.on("error", console.log);
}

start("./main.js");
