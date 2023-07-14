const fs = require("fs");
const path = require("path");

// 指定目录路径
const directoryPath = "./public/static/markdowns";
// 指定目标JSON文件路径
const outputPath = "./src/assets/fileNames.json";

// 读取目录下的所有文件
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log("无法读取目录：", err);
    return;
  }

  const fileData = [];

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const fileInfo = {
      name: file,
      content: fileContent,
    };
    fileData.push(fileInfo);
  });

  // 将文件名保存为JSON格式
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
