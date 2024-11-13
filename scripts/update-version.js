const fs = require('fs');
const path = require('path');

function generateRandomNumber(length) {
    return Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
}

function updateVersion(updateType = 'patch') {
    const packagePath = path.join(__dirname, '../package.json');
    const pkgJson = require(packagePath);
    
    // 解析当前版本号
    const versionParts = pkgJson.version.split('.');
    const [major, minor, patch] = versionParts.map(Number);
    
    // 根据更新类型更新版本号
    switch(updateType.toLowerCase()) {
        case 'major': // 大版本更新
            versionParts[0] = major + 1;
            versionParts[1] = 0;    // 重置次版本号
            versionParts[2] = 0;    // 重置补丁版本号
            break;
        case 'minor': // 功能更新
            versionParts[1] = minor + 1;
            versionParts[2] = 0;    // 重置补丁版本号
            break;
        case 'patch': // bug修复
            versionParts[2] = patch + 1;
            break;
        default:
            console.error('无效的更新类型。请使用 major, minor, 或 patch');
            process.exit(1);
    }
    
    // 生成新的随机数部分
    versionParts[3] = generateRandomNumber(5);
    
    // 更新版本号
    pkgJson.version = versionParts.join('.');
    
    // 写入文件，保持格式
    fs.writeFileSync(
        packagePath,
        JSON.stringify(pkgJson, null, 2) + '\n'
    );
    
    console.log(`版本已更新为: ${pkgJson.version}`);
    console.log(`更新类型: ${updateType}`);
}

// 从命令行参数获取更新类型
const updateType = process.argv[2] || 'patch';
updateVersion(updateType);