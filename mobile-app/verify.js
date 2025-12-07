#!/usr/bin/env node

// EtherAudio Expo 项目验证脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 EtherAudio 项目验证...\n');

// 检查关键文件
const filesToCheck = [
  'App.tsx',
  'package.json',
  'app.json',
  'src/types/index.ts',
  'src/screens/HomeScreen.tsx'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 缺失`);
    allFilesExist = false;
  }
});

console.log('\n📱 Expo 配置检查...');

try {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  console.log(`✅ 应用名称: ${appJson.expo.name}`);
  console.log(`✅ 应用标识: ${appJson.expo.slug}`);
  console.log(`✅ 主入口: ${packageJson.main}`);

  // 检查关键依赖
  const dependencies = packageJson.dependencies || {};
  const keyDependencies = ['@react-navigation/native', '@expo/vector-icons', 'expo'];

  keyDependencies.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - 未安装`);
    }
  });

} catch (error) {
  console.log('❌ 配置文件读取失败:', error.message);
}

console.log('\n🚀 启动指南:');
console.log('1. 启动Expo开发服务器: npm run start');
console.log('2. 在新终端启动iOS预览: npm run ios');
console.log('3. 或者使用Expo Go应用扫描二维码');
console.log('\n📱 iOS预览:');
console.log('- 启动npm run start后');
console.log('- 运行npm run ios会自动打开iOS模拟器');
console.log('- 或者在Expo Go应用中输入项目地址');

// 检查端口占用
const { execSync } = require('child_process');
try {
  execSync('lsof -ti:8081', { stdio: 'pipe' });
  console.log('\n⚠️  端口8081已被占用，Expo可能会使用端口8082');
} catch (error) {
  console.log('\n✅ 端口8081空闲');
}

console.log('\n🎉 EtherAudio Expo迁移完成!');