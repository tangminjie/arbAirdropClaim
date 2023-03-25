# Arb-Claimer

## Arbi 抢空投要点

1. 节点：必须要自己搭 Arbitrum 全节点，用公开的rpc会卡，限制请求次数/速度。节点大概需要 1.4 T硬盘，推荐用 SSD（读写多）
https://developer.arbitrum.io/node-running/running-a-node

2. 对于私钥被很多人知道得可以不claim 直接transfer。。。

3. 建议使用合约进行，可以在一个块中完成

## 说明
1. tasks claim
 使用ethers.js 转移代币 

2. 使用合约转移代币
   PermitAndCollector.sol 批量转移合约
   permitSigClaim.js 712签名调用合约脚本


