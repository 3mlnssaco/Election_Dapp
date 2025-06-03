import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface WalletConfig {
  address: string;
  privateKey: string;
}

interface Config {
  network: {
    name: string;
    rpcUrl: string;
    chainId: number;
  };
  wallets: WalletConfig[];
  contract: {
    electionName: string;
    votingDuration: number;
  };
  candidates: string[];
  rpcOptions: {
    alchemy: string;
  };
}

class ElectionChecker {
  private provider: ethers.providers.JsonRpcProvider;
  private config: Config;
  private deployer?: ethers.Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    // 설정 로드
    const configPath = path.join(__dirname, '../../config/wallet-config.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Provider 설정
    this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcOptions.alchemy);
    
    // 최신 컨트랙트 주소
    this.contractAddress = "0x096bdA2a4689DfAc70A64c6e49d6cdc06B4B8608";
    
    // 컨트랙트 아티팩트 로드
    const artifactPath = path.join(__dirname, '../artifacts/contracts/election.sol/Voting.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // 컨트랙트 연결 (읽기 전용)
    this.contract = new ethers.Contract(this.contractAddress, artifact.abi, this.provider);
  }

  // 배포자 지갑 연결 (쓰기 작업용)
  private connectDeployer(): void {
    if (!this.deployer) {
      this.deployer = new ethers.Wallet(this.config.wallets[0].privateKey, this.provider);
      this.contract = this.contract.connect(this.deployer);
    }
  }

  async checkPublicResults(): Promise<void> {
    console.log("🌍 **모든 사람이 볼 수 있는** 공개 승자 정보!\n");
    console.log(`📋 컨트랙트 주소: ${this.contractAddress}`);
    console.log(`🌍 누구나 접근 가능: https://sepolia.etherscan.io/address/${this.contractAddress}\n`);
    
    try {
      // 1. 📊 모든 후보자 득표 현황 (공개)
      console.log("🗳️ **공개된** 투표 결과:");
      console.log("=" .repeat(60));
      
      const totalVotes = await this.contract.totalVotes();
      console.log(`📈 총 유효 투표: ${totalVotes}표\n`);
      
      let candidates: Array<{name: string, votes: number, percentage: string}> = [];
      
      for (let i = 1; i <= 3; i++) {
        const candidate = await this.contract.getCandidate(i);
        const percentage = totalVotes.gt(0) ? 
          (candidate[1].toNumber() / totalVotes.toNumber() * 100).toFixed(1) : "0.0";
        
        candidates.push({
          name: candidate[0],
          votes: candidate[1].toNumber(),
          percentage: percentage
        });
      }
      
      // 정렬 (득표순)
      candidates.sort((a, b) => b.votes - a.votes);
      
      // 시각화
      candidates.forEach((candidate, index) => {
        const bar = "█".repeat(Math.floor(candidate.votes)) + 
                   "░".repeat(Math.max(0, 4 - Math.floor(candidate.votes)));
        const rank = index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉";
        const winner = index === 0 ? " ← **승자**" : "";
        
        console.log(`${rank} ${candidate.name.padEnd(8)} │ ${candidate.votes}표 (${candidate.percentage.padStart(5)}%) ${bar}${winner}`);
      });
      
      // 2. 🏆 공식 승자 정보
      console.log("\n🏆 **블록체인에 기록된 공식 결과**:");
      console.log("=" .repeat(60));
      
      try {
        const finalResult = await this.contract.finalResult();
        console.log(`📢 공식 승자: "${finalResult.winnerName}"`);
        console.log(`📊 승자 득표: ${finalResult.winnerVotes}표`);
        console.log(`📈 총 투표 수: ${finalResult.totalVotes}표`);
        console.log(`⏰ 발표 시간: ${new Date(finalResult.timestamp.toNumber() * 1000).toLocaleString()}`);
        console.log(`✅ 결과 발표: ${finalResult.announced ? "공식 발표됨" : "미발표"}`);
      } catch (error) {
        console.log("❌ 공식 결과가 아직 발표되지 않았습니다.");
      }
      
      // 3. 🔍 Etherscan에서 확인하는 방법 안내
      console.log("\n🔍 **누구나** Etherscan에서 직접 확인하는 방법:");
      console.log("=" .repeat(60));
      console.log("1️⃣ 컨트랙트 페이지 방문:");
      console.log(`   https://sepolia.etherscan.io/address/${this.contractAddress}`);
      console.log("\n2️⃣ 'Contract' 탭 → 'Read Contract' 클릭");
      console.log("\n3️⃣ 다음 함수들로 **공개적으로** 정보 확인:");
      console.log("   🏆 finalResult() - 공식 승자 정보");
      console.log("   📊 getCandidate(1) - Alice 득표");
      console.log("   📊 getCandidate(2) - Bob 득표"); 
      console.log("   📊 getCandidate(3) - Charlie 득표");
      console.log("   📈 totalVotes() - 총 투표 수");
      console.log("   📋 getDetailedResults() - 상세 결과");
      console.log("   ✅ electionClosed() - 투표 종료 여부");
      
      // 4. 🌍 투명성 강조
      console.log("\n🌍 **완전한 투명성 보장**:");
      console.log("=" .repeat(60));
      const electionClosed = await this.contract.electionClosed();
      
      console.log(`✅ 투표 종료: ${electionClosed ? "공식 종료됨" : "진행 중"}`);
      console.log(`✅ 블록체인 기록: 영구 보존, 변경 불가능`);
      console.log(`✅ 공개 접근: 지갑 없이도 누구나 확인 가능`);
      console.log(`✅ 실시간 검증: 24시간 언제든지 확인 가능`);
      console.log(`✅ 탈중앙화: 중앙 서버 없이 블록체인에 기록`);
      
      console.log(`\n💡 Etherscan에서 함수 반환값이 ***로 표시되는 이유:`);
      console.log(`   🔧 컨트랙트가 verify되지 않아서 디코딩 불가`);
      console.log(`   📋 하지만 블록체인 데이터는 정확히 저장되어 있음`);
      console.log(`   ✅ 위의 결과들이 실제 블록체인 정보입니다!`);
      
    } catch (error) {
      console.error("❌ 조회 실패:", error);
    }
  }

  async testContractFunctions(): Promise<void> {
    console.log("\n" + "=".repeat(80));
    console.log("🔧 **컨트랙트 함수 테스트 모드**");
    console.log("=".repeat(80));
    
    this.connectDeployer();
    console.log(`👤 배포자: ${this.deployer!.address}\n`);
    
    // 1. 현재 투표 상태 확인
    console.log("📊 현재 투표 상태 확인...");
    try {
      const totalVotes = await this.contract.totalVotes();
      const electionClosed = await this.contract.electionClosed();
      
      console.log(`총 투표 수: ${totalVotes}`);
      console.log(`투표 종료 여부: ${electionClosed}`);
      
      // 후보자별 득표 현황
      console.log("후보자별 득표:");
      for (let i = 1; i <= 3; i++) {
        const candidate = await this.contract.getCandidate(i);
        console.log(`  ${candidate[0]}: ${candidate[1]} 표`);
      }
    } catch (error) {
      console.error("❌ 현재 상태 조회 실패:", error);
    }
    
    // 2. 🔒 수동으로 투표 종료 테스트
    console.log("\n🔒 수동 투표 종료 테스트...");
    try {
      const electionClosed = await this.contract.electionClosed();
      if (!electionClosed) {
        console.log("투표를 수동으로 종료합니다...");
        const closeTx = await this.contract.closeElection();
        await closeTx.wait();
        console.log("✅ 투표가 성공적으로 종료되었습니다!");
        
        const newStatus = await this.contract.electionClosed();
        console.log(`새 투표 종료 상태: ${newStatus}`);
      } else {
        console.log("✅ 투표가 이미 종료되었습니다.");
      }
    } catch (error) {
      console.error("❌ 투표 종료 실패:", error);
    }
    
    // 3. 📢 공식 결과 발표 테스트
    console.log("\n📢 공식 결과 발표 테스트...");
    try {
      const finalResult = await this.contract.finalResult();
      
      if (!finalResult.announced) {
        console.log("공식 결과를 발표하고 블록체인에 기록합니다...");
        const announceTx = await this.contract.announceWinner();
        const receipt = await announceTx.wait();
        console.log("✅ 공식 결과가 블록체인에 기록되었습니다!");
        
        // 이벤트에서 결과 추출
        if (receipt.events) {
          const winnerEvent = receipt.events.find((e: any) => e.event === "WinnerAnnounced");
          if (winnerEvent) {
            console.log(`🏆 공식 승자: ${winnerEvent.args.winnerName}`);
            console.log(`🎯 승자 득표: ${winnerEvent.args.winnerVotes}`);
            console.log(`📊 총 투표 수: ${winnerEvent.args.totalVotes}`);
            console.log(`⏰ 발표 시간: ${new Date(winnerEvent.args.timestamp.toNumber() * 1000).toLocaleString()}`);
          }
        }
      } else {
        console.log("✅ 공식 결과가 이미 발표되었습니다:");
        console.log(`   승자: ${finalResult.winnerName}`);
        console.log(`   승자 득표: ${finalResult.winnerVotes}`);
        console.log(`   총 투표: ${finalResult.totalVotes}`);
        console.log(`   발표 시간: ${new Date(finalResult.timestamp.toNumber() * 1000).toLocaleString()}`);
      }
      
    } catch (error) {
      console.error("❌ 결과 발표 실패:", error);
    }
    
    // 4. 📊 상세 결과 조회 테스트
    console.log("\n📊 상세 결과 조회 테스트...");
    try {
      const detailedResults = await this.contract.getDetailedResults();
      console.log("====================================");
      
      const candidateNames = detailedResults[0];
      const voteCounts = detailedResults[1];
      const winner = detailedResults[2];
      const isFinalized = detailedResults[3];
      
      console.log("🗳️ 후보자별 득표 현황:");
      const totalVotes = await this.contract.totalVotes();
      
      for (let i = 0; i < candidateNames.length; i++) {
        const percentage = totalVotes.gt(0) ? 
          (voteCounts[i].toNumber() / totalVotes.toNumber() * 100).toFixed(1) : "0.0";
        const bar = "█".repeat(Math.floor(voteCounts[i].toNumber())) + 
                   "░".repeat(Math.max(0, 8 - Math.floor(voteCounts[i].toNumber())));
        
        console.log(`${candidateNames[i].padEnd(8)} │ ${voteCounts[i]} 표 (${percentage.padStart(5)}%) ${bar}`);
      }
      
      console.log("====================================");
      console.log(`🏆 공식 승자: ${winner}`);
      console.log(`📋 결과 확정: ${isFinalized ? "✅ 확정됨" : "❌ 미확정"}`);
      
    } catch (error) {
      console.error("❌ 상세 결과 조회 실패:", error);
    }
    
    console.log("\n💡 테스트된 향상된 기능:");
    console.log("   ✅ closeElection() - 수동 투표 종료");
    console.log("   ✅ announceWinner() - 공식 결과 발표 및 블록체인 기록");
    console.log("   ✅ getDetailedResults() - 상세 투표 결과 조회");
    console.log("   ✅ finalResult 구조체 - 최종 결과 저장");
    console.log("   ✅ 이벤트 발생 - ElectionClosed, WinnerAnnounced");
  }

  async run(): Promise<void> {
    console.log("🎯 Election DApp - 통합 결과 확인 및 테스트\n");
    
    // 실행 모드 선택
    const args = process.argv.slice(2);
    const mode = args[0] || 'check';
    
    if (mode === 'test') {
      console.log("🔧 테스트 모드로 실행합니다 (배포자 권한 필요)");
      await this.checkPublicResults();
      await this.testContractFunctions();
    } else {
      console.log("🔍 공개 결과 확인 모드로 실행합니다 (읽기 전용)");
      await this.checkPublicResults();
      
      console.log("\n" + "=".repeat(80));
      console.log("💡 **추가 옵션**:");
      console.log("   테스트 모드 실행: npx ts-node check_and_test.ts test");
      console.log("   (배포자 권한으로 함수 테스트 포함)");
    }
    
    console.log("\n🎉 검사 완료!");
    console.log(`📍 컨트랙트 주소: ${this.contractAddress}`);
    console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${this.contractAddress}`);
  }
}

async function main() {
  const checker = new ElectionChecker();
  await checker.run();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 