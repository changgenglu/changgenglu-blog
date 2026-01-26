const fs = require("fs");
const path = require("path");

// 指定目錄路徑
const directoryPath = "./public/markdownFiles";
// 指定目標 JSON 的路徑
const outputDirectory = "./src/assets/jsonFiles";

/**
 * 編譯 Markdown 檔案
 * @param {string} targetDir 
 * @param {string} outputDir 
 */
function compileMarkdownFiles(targetDir, outputDir) {
  // 確認輸出目錄存在，若不存在則建立
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 讀取資料夾底下所有檔案
  fs.readdir(targetDir, (err, files) => {
    if (err) {
      console.log("無法讀取資料夾：", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(targetDir, file);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const fileInfo = {
        name: file,
        content: fileContent,
        tocContent: "",
      };

      const tocStartIndex = fileContent.indexOf("<!-- TOC -->");
      const tocEndIndex = fileContent.indexOf("<!-- /TOC -->");

      if (tocStartIndex !== -1 && tocEndIndex !== -1) {
        fileInfo.tocContent = fileContent
          .substring(tocStartIndex + 13, tocEndIndex)
          .trim();
        fileInfo.content =
          fileContent.substring(0, tocStartIndex) +
          fileContent.substring(tocEndIndex + 12);
      }

      const jsonContent = JSON.stringify(fileInfo);
      const jsonFileName = path.basename(file, path.extname(file)) + ".json";
      const jsonFilePath = path.join(outputDir, jsonFileName);

      // 生成 JSON 文件
      fs.writeFile(jsonFilePath, jsonContent, "utf8", (err) => {
        if (err) {
          console.log("無法建立JSON文件：", err);
          return;
        }
        console.log(`已建立 ${jsonFileName} JSON文件！`);
      });
    });
  });
}

// 判斷是否被直接執行 (CLI entry point)
if (require.main === module) {
  compileMarkdownFiles(directoryPath, outputDirectory);
}

module.exports = { compileMarkdownFiles };
