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

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const fileStats = fs.statSync(filePath);
    const fileDate = fileStats.mtime;
    const fileInfo = {
      name: file,
      content: fileContent,
      date: fileDate,
    };
    fileData.push(fileInfo);
  });

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
