# 🗳️ Election DApp - 투명한 블록체인 투표 시스템

완전히 탈중앙화된 투표 시스템으로, Sepolia 테스트넷에서 실제 가스를 사용하여 투명하고 변경 불가능한 투표를 제공합니다.

## 📋 프로젝트 개요

- **블록체인**: Ethereum Sepolia Testnet
- **스마트 컨트랙트**: Solidity 0.8.20
- **프레임워크**: Hardhat + TypeScript
- **라이브러리**: ethers.js v5

## 🏗️ 프로젝트 구조

```
Election_Dapp/
├── contracts/                 # 스마트 컨트랙트
│   └── election.sol          # 메인 투표 컨트랙트
├── scripts/                  # 실행 스크립트
│   ├── main_voting_automation.ts    # 🚀 메인 자동화 스크립트
│   ├── check_public_results.ts     # 🔍 공개 결과 확인
│   └── test_contract_functions.ts  # 🧪 컨트랙트 함수 테스트
├── artifacts/                # 컴파일된 컨트랙트
├── cache/                    # Hardhat 캐시
└── config files...           # 설정 파일들
```

## ⚡ 빠른 시작

### 1️⃣ 설치 및 설정

```bash
# 의존성 설치
npm install

# 컨트랙트 컴파일
npx hardhat compile
```

### 2️⃣ 전체 투표 시나리오 실행

```bash
# 🚀 완전 자동화된 투표 시스템 실행
npx ts-node scripts/main_voting_automation.ts
```

**이 명령어 하나로 다음이 모두 자동 실행됩니다:**
- 💰 8개 지갑에 ETH 자동 충전
- 🚀 스마트 컨트랙트 배포
- 👥 후보자 등록 (Alice, Bob, Charlie)
- 🔑 투표자 권한 부여 (8명)
- 🗳️ 전략적 투표 (4:3:1 비율)
- 🔒 투표 수동 종료
- 📢 공식 결과 블록체인 기록
- 📊 상세 결과 보고서

### 3️⃣ 공개 결과 확인

```bash
# 🔍 누구나 확인 가능한 투표 결과 조회
npx ts-node scripts/check_public_results.ts
```

## 🎯 주요 기능

### ✅ **완전 자동화**
- 8개 지갑을 이용한 멀티 사용자 시뮬레이션
- 실제 가스비를 사용한 진짜 블록체인 거래
- 전략적 투표 패턴 (4:3:1 비율로 명확한 승부)

### ✅ **투명성 보장**
- 모든 투표가 블록체인에 영구 기록
- 누구나 Etherscan에서 결과 확인 가능
- 변경 불가능한 결과 보장

### ✅ **향상된 기능**
- 📝 수동 투표 종료 (시간 기반 + 관리자 종료)
- 📢 공식 결과 발표 및 블록체인 기록
- 🔍 상세한 결과 조회 기능
- 📊 실시간 투표 현황 확인

## 📊 최근 실행 결과

**📍 컨트랙트 주소**: `0x096bdA2a4689DfAc70A64c6e49d6cdc06B4B8608`

**🏆 투표 결과**:
- **Alice**: 4표 (50.0%) - 승자 🏆
- **Bob**: 3표 (37.5%) 🥈
- **Charlie**: 1표 (12.5%) 🥉

**🔗 Etherscan**: https://sepolia.etherscan.io/address/0x096bdA2a4689DfAc70A64c6e49d6cdc06B4B8608

## 📁 스크립트 설명

### 🚀 `main_voting_automation.ts`
**전체 투표 시나리오 자동화 실행**
- 컨트랙트 배포부터 결과 발표까지 원클릭 실행
- 8명의 투표자가 참여하는 현실적인 시뮬레이션
- 4:3:1 비율의 전략적 투표 패턴

### 🔍 `check_public_results.ts`
**공개 투표 결과 확인**
- 누구나 실행 가능한 결과 조회
- Etherscan 확인 방법 안내
- 투명성 보장 확인

### 🧪 `test_contract_functions.ts`
**컨트랙트 함수 개별 테스트**
- 향상된 기능들의 동작 확인
- 수동 종료, 결과 발표 등 테스트

## 🔧 기술 스택

- **Solidity**: 스마트 컨트랙트 개발
- **Hardhat**: 개발 프레임워크
- **TypeScript**: 스크립트 개발
- **ethers.js**: 블록체인 상호작용
- **Sepolia**: 테스트넷 배포

## 🌍 투명성 및 공개성

이 프로젝트의 모든 투표 결과는:
- ✅ **블록체인에 영구 기록**
- ✅ **누구나 확인 가능**
- ✅ **변경 불가능**
- ✅ **실시간 검증 가능**

## 📞 문의

프로젝트에 대한 질문이나 개선 사항이 있으시면 언제든지 문의해주세요!

---

*Made with ❤️ for transparent and decentralized voting* 