const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 指定目錄路徑
const directoryPath = "./public/markdownFiles";

// 指定目標 json 的路徑
const outputPath = "./src/assets/fileNames.json";

/**
 * 獲取檔案的 Git 最後提交時間
 * @param {string} filePath 
 * @param {object} deps 依賴項 (用於測試)
 * @returns {Date}
 */
function getFileGitDate(filePath, deps = { exec: execSync, stat: fs.statSync }) {
  const { exec, stat } = deps;
  try {
    // %cI: committer date, strict ISO 8601 format
    const stdout = exec(`git log -1 --format=%cI "${filePath}"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    if (stdout) {
      const dateStr = stdout.trim();
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  } catch (e) {
    // 發生錯誤時忽略，交由 fallback 處理
  }

  // Fallback: 使用檔案系統修改時間
  return stat(filePath).mtime;
}

/**
 * 生成檔案列表
 * @param {string} targetDir 
 * @param {string} output 
 * @param {object} deps 依賴項 (用於測試)
 */
function generateFileList(targetDir, output, deps = { exec: execSync, stat: fs.statSync }) {
  // 讀取資料夾底下所有檔案
  fs.readdir(targetDir, (err, files) => {
    if (err) {
      console.log("無法讀取資料夾：", err);
      return;
    }

    const fileData = [];

    files.forEach((file) => {
      const filePath = path.join(targetDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const fileDate = getFileGitDate(filePath, deps);
      const lines = fileContent.split("\n");
      const matchingLines = lines.filter((line) => line.startsWith("## "));
      const fileInfo = {
        name: file,
        date: fileDate,
        matchingLines: matchingLines,
      };

      fileData.push(fileInfo);
    });

    // 依檔案修改時間倒序
    fileData.sort((a, b) => b.date - a.date);

    // 輸出為 json 格式
    const jsonContent = JSON.stringify(fileData);

    // 生成JSON文件
    fs.writeFile(output, jsonContent, "utf8", (err) => {
      if (err) {
        console.log("無法建立目錄：", err);
        return;
      }
      console.log("目錄已建立！");
    });
  });
}

// 判斷是否被直接執行 (CLI entry point)
if (require.main === module) {
  generateFileList(directoryPath, outputPath);
}

module.exports = { getFileGitDate, generateFileList };
