const fs = require("fs");
const path = require("path");

// 指定目錄路徑
const directoryPath = "./public/static/markdowns";
// 指定目標 json 的路徑
const outputPath = "./src/assets/fileNames.json";

// 讀取資料夾底下所有檔案
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log("无法读取目录：", err);
    return;
  }

  const fileData = [];

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const fileStats = fs.statSync(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileDate = fileStats.mtime; // 获取文件的修改日期时间戳
    const lines = fileContent.split('\n');
    const matchingLines = lines.filter(line => line.startsWith('## '));
    const fileInfo = {
      name: file,
      content: fileContent,
      date: fileDate,
      matchingLines: matchingLines
    };
    fileData.push(fileInfo);
  });

  // 根据文件的修改日期倒序排序
  fileData.sort((a, b) => b.date - a.date);

  // 輸出為 json 格式
  const jsonContent = JSON.stringify(fileData);

  // 生成JSON文件
  fs.writeFile(outputPath, jsonContent, "utf8", (err) => {
    if (err) {
      console.log("无法生成JSON文件：", err);
      return;
    }
    console.log("JSON文件已生成！");
  });
});
