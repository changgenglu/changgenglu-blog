const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 指定目錄路徑
const directoryPath = "./public/markdownFiles";

// 指定目標 json 的路徑
const outputPath = "./src/assets/fileNames.json";

// 外部來源設定
const promptEngineeringSrc = "./prompt_engineering";
const promptEngineeringDest = "./public/markdownFiles/提示詞工程";

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
 * 同步外部檔案 (如 prompt_engineering) 到 public 目錄
 * @param {object} deps 依賴
 */
function syncExternalFiles(deps = { fs } ) {
  const fileSystem = deps.fs || fs;
  try {
    if (!fileSystem.existsSync(promptEngineeringDest)) {
      fileSystem.mkdirSync(promptEngineeringDest, { recursive: true });
    }

    if (fileSystem.existsSync(promptEngineeringSrc)) {
      const files = fileSystem.readdirSync(promptEngineeringSrc);
      files.forEach(file => {
        if (path.extname(file) === '.md') {
          const srcPath = path.join(promptEngineeringSrc, file);
          const destPath = path.join(promptEngineeringDest, file);
          fileSystem.copyFileSync(srcPath, destPath);
          console.log(`Copied: ${file}`);
        }
      });
    } else {
      console.warn(`Source directory not found: ${promptEngineeringSrc}`);
    }
  } catch (err) {
    console.error("Error syncing external files:", err);
  }
}

/**
 * 遞迴掃描目錄
 * @param {string} dir當前掃描目錄
 * @param {string} rootDir 根目錄 (用於計算相對路徑)
 * @param {object} deps 依賴
 * @returns {Array} 檔案資訊列表
 */
function scanDirectory(dir, rootDir, deps) {
  const fileSystem = deps.fs || fs;
  let results = [];
  const list = fileSystem.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fileSystem.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(filePath, rootDir, deps));
    } else {
      if (path.extname(file) !== '.md') return;

      const relativePath = path.relative(rootDir, filePath);
      const pathParts = relativePath.split(path.sep);
      
      let category = "Uncategorized";
      if (pathParts.length > 1) {
        category = pathParts[0];
      }

      const fileContent = fileSystem.readFileSync(filePath, "utf8");
      const fileDate = getFileGitDate(filePath, deps);
      const lines = fileContent.split("\n");
      const matchingLines = lines.filter((line) => line.startsWith("## "));

      results.push({
        name: file,
        category: category,
        path: relativePath.replace(/\\/g, '/'),
        date: fileDate,
        matchingLines: matchingLines,
      });
    }
  });

  return results;
}

/**
 * 生成檔案列表
 * @param {string} targetDir 
 * @param {string} output 
 * @param {object} deps 依賴項 (用於測試)
 */
function generateFileList(targetDir, output, deps = { exec: execSync, stat: fs.statSync, fs: fs }) {
  // 1. 同步外部檔案
  syncExternalFiles({ fs: deps.fs });

  try {
    // 2. 遞迴掃描並生成資料
    const fileData = scanDirectory(targetDir, targetDir, deps);

    // 依檔案修改時間倒序
    fileData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 輸出為 json 格式
    const jsonContent = JSON.stringify(fileData, null, 2);

    // 生成JSON文件
    deps.fs.writeFileSync(output, jsonContent, "utf8");
    console.log("目錄已建立！");
  } catch (err) {
    console.log("無法建立目錄：", err);
  }
}

// 判斷是否被直接執行
if (require.main === module) {
  generateFileList(directoryPath, outputPath);
}

module.exports = { getFileGitDate, generateFileList, syncExternalFiles, scanDirectory };
