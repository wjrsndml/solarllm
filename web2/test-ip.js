const { networkInterfaces } = require('os');

function getLocalIP() {
  try {
    const interfaces = networkInterfaces();
    
    console.log('所有网络接口:');
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      console.log(`\n接口 ${name}:`);
      if (iface) {
        for (const alias of iface) {
          console.log(`  - ${alias.family}: ${alias.address} (internal: ${alias.internal})`);
        }
      }
    }
    
    // 优先查找以太网接口
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      
      for (const alias of iface) {
        // 跳过内部地址、IPv6地址和回环地址
        if (alias.family === 'IPv4' && !alias.internal) {
          // 优先返回10.x.x.x网段的IP（通常是内网IP）
          if (alias.address.startsWith('10.')) {
            return alias.address;
          }
          // 如果没有10.x.x.x，返回其他内网IP
          if (alias.address.startsWith('192.168.') || alias.address.startsWith('172.')) {
            return alias.address;
          }
        }
      }
    }
    
    // 如果上面没找到，返回第一个可用的IPv4地址
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
    
    return '127.0.0.1';
  } catch (error) {
    console.error('获取本地IP出错:', error);
    return '127.0.0.1';
  }
}

function getApiBaseUrl() {
  const localIP = getLocalIP();
  return `http://${localIP}:8000/api`;
}

console.log('\n=== IP检测测试 ===');
console.log('检测到的本地IP:', getLocalIP());
console.log('生成的API地址:', getApiBaseUrl()); 