# 📁 Scripts 폴더 - 실행 스크립트 모음

이 폴더에는 Election DApp의 모든 실행 가능한 스크립트들이 포함되어 있습니다.

## 🚀 메인 스크립트

### `main_voting_automation.ts`
**전체 투표 시나리오 완전 자동화**

```bash
npx ts-node main_voting_automation.ts
```

**실행 과정:**
1. 🏗️ **환경 설정**
   - 8개 지갑 준비 (배포자 + 7명 테스트 사용자)
   - Sepolia 네트워크 연결

2. 🚀 **컨트랙트 배포**
   - 향상된 투표 컨트랙트 배포
   - 가스비 자동 최적화

3. 👥 **후보자 등록**
   - Alice, Bob, Charlie 자동 등록
   - 블록체인에 후보자 정보 기록

4. 🔑 **권한 부여**
   - 모든 투표자에게 자동 권한 부여
   - 배포자도 투표 참여

5. 🗳️ **전략적 투표**
   - 4:3:1 비율로 투표 (Alice:Bob:Charlie)
   - 실제 가스비 사용
   - 각 투표마다 잔액 추적

6. 🔒 **투표 종료**
   - 배포자가 수동으로 투표 종료
   - 시간 제한과 관계없이 즉시 종료

7. 📢 **결과 발표**
   - 공식 승자를 블록체인에 영구 기록
   - 이벤트 로그로 투명한 결과 공개

8. 📊 **상세 보고서**
   - 후보별 득표 현황
   - 가스 사용량 리포트
   - Etherscan 링크 제공

---

## 🔍 확인 스크립트

### `check_public_results.ts`
**공개 투표 결과 확인**

```bash
npx ts-node check_public_results.ts
```

**기능:**
- 📊 실시간 투표 결과 조회
- 🏆 공식 승자 정보 확인
- 🔗 Etherscan 확인 방법 안내
- 🌍 투명성 검증 가이드

**누구나 실행 가능:**
- 지갑 연결 불필요
- 읽기 전용 조회
- 실시간 블록체인 데이터

---

## 🧪 테스트 스크립트

### `test_contract_functions.ts`
**컨트랙트 함수 개별 테스트**

```bash
npx ts-node test_contract_functions.ts
```

**테스트 항목:**
- ✅ 수동 투표 종료 기능
- ✅ 공식 결과 발표 기능
- ✅ 상세 결과 조회 기능
- ✅ 이벤트 로그 확인
- ✅ 권한 관리 테스트

---

## 📋 실행 순서

### 🎯 **첫 실행 시 (추천)**
```bash
# 1. 전체 자동화 실행
npx ts-node main_voting_automation.ts

# 2. 결과 확인
npx ts-node check_public_results.ts
```

### 🔧 **개발/테스트 시**
```bash
# 개별 기능 테스트
npx ts-node test_contract_functions.ts

# 결과 확인
npx ts-node check_public_results.ts
```

---

## ⚙️ 설정 파일

모든 스크립트는 다음 설정을 사용합니다:
- **설정 파일**: `../config/wallet-config.json`
- **네트워크**: Sepolia Testnet
- **컨트랙트**: `../contracts/election.sol`

---

## 🔧 문제 해결

### 가스 부족 오류
```bash
# 잔액 확인
npx ts-node check_public_results.ts
```

### 네트워크 연결 오류
- Alchemy API 키 확인
- Sepolia 네트워크 상태 확인

### 컨트랙트 주소 업데이트
각 스크립트에서 `contractAddress` 변수 수정

---

## 📊 최근 실행 결과

**성공한 자동화 실행:**
- **컨트랙트**: `0x096bdA2a4689DfAc70A64c6e49d6cdc06B4B8608`
- **승자**: Alice (4표, 50%)
- **참여자**: 8명
- **투표 패턴**: 4:3:1
- **실행 시간**: ~5분
- **총 가스비**: ~0.002 ETH

**🔗 Etherscan**: https://sepolia.etherscan.io/address/0x096bdA2a4689DfAc70A64c6e49d6cdc06B4B8608 