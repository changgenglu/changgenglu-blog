const fs = require("fs");
const path = require("path");

// 指定目錄路徑
const directoryPath = "./src/markdownFiles";

// 指定目標 json 的路徑
const outputPath = "./src/assets/fileNames.json";

// 讀取資料夾底下所有檔案
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log("無法讀取資料夾：", err);
    return;
  }

  const fileData = [];

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const fileStats = fs.statSync(filePath);
    const fileContent = fs.readFileSync(filePath, "utf8");

    const fileDate = fileStats.mtime; // 取得檔案修改日期
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
  fs.writeFile(outputPath, jsonContent, "utf8", (err) => {
    if (err) {
      console.log("無法建立目錄：", err);
      return;
    }
    console.log("目錄已建立！");
  });
});
