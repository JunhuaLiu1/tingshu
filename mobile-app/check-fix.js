#!/usr/bin/env node

// EtherAudio iOS空白页面修复验证脚本
const fs = require('fs');
const path = require('path');

console.log('🔧 检查iOS空白页面修复...\n');

// 检查关键文件是否已修复图标导入
const filesToCheck = [
  'src/App.tsx',
  'src/screens/HomeScreen.tsx',
  'src/screens/SearchScreen.tsx',
  'src/screens/PlayerScreen.tsx',
  'src/screens/HistoryScreen.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/components/HeroCarousel.tsx',
  'src/components/CategoryTabs.tsx',
  'src/components/EditorsPick.tsx',
  'src/components/Rankings.tsx'
];

let allFixed = true;

console.log('📱 检查图标库导入修复:');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('@expo/vector-icons')) {
      console.log(`✅ ${file} - 已修复`);
    } else if (content.includes('react-native-vector-icons')) {
      console.log(`❌ ${file} - 仍使用旧图标库`);
      allFixed = false;
    } else {
      console.log(`⚠️  ${file} - 未找到图标导入`);
    }
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allFixed = false;
  }
});

console.log('\n🔄 检查Metro Bundler状态:');
const { execSync } = require('child_process');
try {
  const status = execSync('curl -s http://localhost:8081/status', { stdio: 'pipe' }).toString();
  console.log(`✅ Metro Bundler: ${status.trim()}`);
} catch (error) {
  console.log('❌ Metro Bundler未响应，请启动 npm run start');
  allFixed = false;
}

console.log('\n📋 修复总结:');
if (allFixed) {
  console.log('✅ 所有图标导入已修复！');
  console.log('✅ iOS空白页面问题应已解决');
  console.log('\n🚀 下一步:');
  console.log('1. 确保Metro Bundler正在运行 (npm run start)');
  console.log('2. 使用Expo Go应用扫描二维码');
  console.log('3. 或运行 npm run ios 启动iOS模拟器');
} else {
  console.log('❌ 仍有文件需要修复');
  console.log('请检查上面的错误并手动修复');
}

console.log('\n🎯 如果问题仍存在，尝试:');
console.log('1. npx expo start --clear (清理缓存)');
console.log('2. rm -rf node_modules && npm install (重新安装依赖)');
console.log('3. 重启开发服务器');