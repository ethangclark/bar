// assertDepsInstalled.js
import { exec } from "child_process";

exec("ffmpeg -version", (error, stdout) => {
  if (error) {
    throw new Error("ffmpeg is not installed or not available in PATH");
  } else {
    console.log("ffmpeg is installed:\n", stdout.split("\n")[0]);
  }
});
