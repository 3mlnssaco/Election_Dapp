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

class EnhancedVotingAutomation {
  private provider: ethers.providers.JsonRpcProvider;
  private config: Config;
  private deployer: ethers.Wallet;
  private testUsers: ethers.Wallet[];
  private contract?: ethers.Contract;

  constructor() {
    // 설정 로드
    const configPath = path.join(__dirname, '../../config/wallet-config.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Provider 설정
    this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcOptions.alchemy);
    
    // 지갑 설정
    this.deployer = new ethers.Wallet(this.config.wallets[0].privateKey, this.provider);
    this.testUsers = this.config.wallets.slice(1).map(w => 
      new ethers.Wallet(w.privateKey, this.provider)
    );
    
    console.log('🎯 향상된 투표 시나리오 자동화 설정 완료');
    console.log(`   📍 배포자: ${this.deployer.address}`);
    console.log(`   👥 테스트 사용자: ${this.testUsers.length}명`);
  }

  async deployContract(): Promise<string> {
    console.log('\n🚀 향상된 투표 컨트랙트 배포 중...');
    console.log('=========================================');
    
    try {
      const balance = await this.deployer.getBalance();
      console.log(`💰 배포자 잔액: ${ethers.utils.formatEther(balance)} ETH`);
      
      // 아티팩트 로드
      const artifactPath = path.join(__dirname, '../artifacts/contracts/election.sol/Voting.json');
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      // Contract Factory 생성
      const contractFactory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        this.deployer
      );
      
      // 네트워크 가스 가격 확인
      const gasPrice = await this.provider.getGasPrice();
      console.log(`⛽ 현재 가스 가격: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
      
      // 배포
      const contract = await contractFactory.deploy(
        this.config.contract.electionName,
        this.config.contract.votingDuration,
        {
          gasLimit: 3000000,  // 향상된 컨트랙트를 위해 가스 한계 증가
          gasPrice: gasPrice
        }
      );
      
      console.log(`📋 트랜잭션 해시: ${contract.deployTransaction.hash}`);
      console.log(`⏳ 배포 확인 대기 중...`);
      
      await contract.deployed();
      
      this.contract = contract;
      console.log(`✅ 향상된 컨트랙트 배포 완료: ${contract.address}`);
      
      return contract.address;
      
    } catch (error: any) {
      console.error('❌ 배포 실패:', error.message);
      throw error;
    }
  }

  async registerCandidates(): Promise<void> {
    if (!this.contract) throw new Error('Contract not deployed');
    
    console.log('\n🗳️ 후보자 등록 중...');
    console.log('=======================');
    
    for (const candidate of this.config.candidates) {
      try {
        const gasPrice = await this.provider.getGasPrice();
        const tx = await this.contract.addCandidate(candidate, {
          gasLimit: 300000,
          gasPrice: gasPrice
        });
        
        console.log(`📝 후보자 "${candidate}" 등록 중... (${tx.hash})`);
        await tx.wait();
        console.log(`✅ "${candidate}" 등록 완료`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`❌ 후보자 "${candidate}" 등록 실패:`, error.message);
      }
    }
  }

  async authorizeAllVoters(): Promise<void> {
    if (!this.contract) throw new Error('Contract not deployed');
    
    console.log('\n👥 모든 투표자 권한 부여 중...');
    console.log('=================================');
    
    // 배포자도 투표 권한 부여
    console.log('🔑 배포자 권한 부여...');
    try {
      const gasPrice = await this.provider.getGasPrice();
      const tx = await this.contract.authorize(this.deployer.address, {
        gasLimit: 100000,
        gasPrice: gasPrice
      });
      await tx.wait();
      console.log('✅ 배포자 권한 부여 완료');
    } catch (error: any) {
      console.error('❌ 배포자 권한 부여 실패:', error.message);
    }
    
    // 테스트 사용자들 권한 부여
    for (let i = 0; i < this.testUsers.length; i++) {
      const user = this.testUsers[i];
      try {
        const gasPrice = await this.provider.getGasPrice();
        const tx = await this.contract.authorize(user.address, {
          gasLimit: 100000,
          gasPrice: gasPrice
        });
        
        console.log(`🔑 사용자 ${i+1} (${user.address}) 권한 부여 중...`);
        await tx.wait();
        console.log(`✅ 사용자 ${i+1} 권한 부여 완료`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`❌ 사용자 ${i+1} 권한 부여 실패:`, error.message);
      }
    }
  }

  async simulateStrategicVoting(): Promise<void> {
    if (!this.contract) throw new Error('Contract not deployed');
    
    console.log('\n🗳️ 전략적 투표 시뮬레이션 (4:3:1 비율)...');
    console.log('===============================================');
    
    // 모든 투표자 (배포자 + 테스트 사용자들)
    const allVoters = [this.deployer, ...this.testUsers];
    
    // 전략적 투표 패턴 (4:3:1 비율을 위한 패턴)
    // Alice: 4표, Bob: 3표, Charlie: 1표
    const votingPattern = [
      1, // 배포자 -> Alice (1번 후보)
      1, // 사용자1 -> Alice
      1, // 사용자2 -> Alice  
      1, // 사용자3 -> Alice (Alice: 4표)
      2, // 사용자4 -> Bob (2번 후보)
      2, // 사용자5 -> Bob
      2, // 사용자6 -> Bob (Bob: 3표)
      3  // 사용자7 -> Charlie (3번 후보) (Charlie: 1표)
    ];
    
    for (let i = 0; i < allVoters.length; i++) {
      const voter = allVoters[i];
      const voterContract = this.contract.connect(voter);
      const candidateId = votingPattern[i];
      const candidateName = this.config.candidates[candidateId - 1];
      
      try {
        // 투표 전 잔액 확인
        const beforeBalance = await voter.getBalance();
        console.log(`\n👤 투표자 ${i+1}: ${voter.address}`);
        console.log(`   💰 투표 전 잔액: ${ethers.utils.formatEther(beforeBalance)} ETH`);
        
        const gasPrice = await this.provider.getGasPrice();
        const tx = await voterContract.vote(candidateId, {
          gasLimit: 200000,
          gasPrice: gasPrice
        });
        
        console.log(`🗳️ "${candidateName}"에게 투표 중... (${tx.hash})`);
        const receipt = await tx.wait();
        
        const afterBalance = await voter.getBalance();
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
        
        console.log(`✅ 투표 완료!`);
        console.log(`   ⛽ 가스 사용: ${ethers.utils.formatEther(gasUsed)} ETH`);
        console.log(`   💰 투표 후 잔액: ${ethers.utils.formatEther(afterBalance)} ETH`);
        
        // 2초 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`❌ 투표자 ${i+1} 투표 실패:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async closeElectionAndAnnounce(): Promise<void> {
    if (!this.contract) throw new Error('Contract not deployed');
    
    console.log('\n🔒 배포자가 투표 수동 종료...');
    console.log('=====================================');
    
    try {
      // 1. 투표 수동 종료
      const gasPrice = await this.provider.getGasPrice();
      const closeTx = await this.contract.closeElection({
        gasLimit: 150000,
        gasPrice: gasPrice
      });
      
      console.log(`🔒 투표 종료 중... (${closeTx.hash})`);
      await closeTx.wait();
      console.log('✅ 투표가 수동으로 종료되었습니다!');
      
      // 3초 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. 공식 결과 발표
      console.log('\n📢 공식 결과 발표 및 블록체인 기록...');
      console.log('==========================================');
      
      const announceTx = await this.contract.announceWinner({
        gasLimit: 200000,
        gasPrice: gasPrice
      });
      
      console.log(`📢 결과 발표 중... (${announceTx.hash})`);
      const announceReceipt = await announceTx.wait();
      console.log('✅ 공식 결과가 블록체인에 영구 기록되었습니다!');
      
      // 이벤트 로그에서 발표 결과 추출
      const event = announceReceipt.events?.find((e: any) => e.event === 'WinnerAnnounced');
      if (event) {
        console.log('\n🎉 공식 발표 내용:');
        console.log(`   🏆 승자: ${event.args?.winnerName}`);
        console.log(`   📊 득표수: ${event.args?.winnerVotes}`);
        console.log(`   🗳️ 총 투표: ${event.args?.totalVotes}`);
        console.log(`   ⏰ 발표 시각: ${new Date(event.args?.timestamp * 1000).toLocaleString()}`);
      }
      
    } catch (error: any) {
      console.error('❌ 투표 종료 또는 결과 발표 실패:', error.message);
    }
  }

  async showFinalResults(): Promise<void> {
    if (!this.contract) throw new Error('Contract not deployed');
    
    console.log('\n📊 최종 투표 결과 상세 보고서...');
    console.log('====================================');
    
    try {
      // 상세 결과 조회
      const [candidateNames, voteCounts, winner, isFinalized] = await this.contract.getDetailedResults();
      
      console.log('🏆 후보별 득표 결과:');
      for (let i = 0; i < candidateNames.length; i++) {
        const percentage = ((voteCounts[i] / 8) * 100).toFixed(1);
        const stars = '★'.repeat(voteCounts[i]);
        console.log(`   ${candidateNames[i]}: ${voteCounts[i]}표 (${percentage}%) ${stars}`);
      }
      
      console.log(`\n🎯 공식 승자: ${winner}`);
      console.log(`📋 결과 확정: ${isFinalized ? 'YES - 블록체인에 영구 기록됨' : 'NO'}`);
      
      // 최종 결과 구조체 조회
      const finalResult = await this.contract.finalResult();
      if (finalResult.announced) {
        console.log('\n📜 블록체인 기록된 공식 결과:');
        console.log(`   🏆 공식 승자: ${finalResult.winnerName}`);
        console.log(`   📊 승자 득표: ${finalResult.winnerVotes}표`);
        console.log(`   🗳️ 총 투표수: ${finalResult.totalVotes}표`);
        console.log(`   ⏰ 발표 시각: ${new Date(finalResult.timestamp * 1000).toLocaleString()}`);
        console.log(`   ✅ 공식 발표: ${finalResult.announced ? 'YES' : 'NO'}`);
      }
      
      console.log('\n📋 선거 요약:');
      console.log(`   📍 컨트랙트: ${this.contract.address}`);
      console.log(`   📝 선거명: ${this.config.contract.electionName}`);
      console.log(`   🗳️ 총 후보: ${candidateNames.length}명`);
      console.log(`   👥 총 투표자: 8명 (배포자 + 7명 테스트 사용자)`);
      console.log(`   📊 투표 패턴: 4:3:1 (명확한 승부)`);
      console.log(`   🔒 종료 방식: 배포자 수동 종료`);
      console.log(`   📢 결과 발표: 블록체인 영구 기록`);
      
    } catch (error: any) {
      console.error('❌ 최종 결과 조회 실패:', error.message);
    }
  }

  async runEnhancedScenario(): Promise<void> {
    console.log('🎭 향상된 투표 시나리오 자동화 시작!');
    console.log('======================================\n');
    
    try {
      // 1. 컨트랙트 배포
      const contractAddress = await this.deployContract();
      
      // 2. 후보자 등록
      await this.registerCandidates();
      
      // 3. 모든 투표자 권한 부여
      await this.authorizeAllVoters();
      
      // 4. 전략적 투표 (4:3:1 비율)
      await this.simulateStrategicVoting();
      
      // 5. 투표 수동 종료 및 공식 결과 발표
      await this.closeElectionAndAnnounce();
      
      // 6. 최종 결과 상세 보고서
      await this.showFinalResults();
      
      console.log('\n🎉 향상된 투표 시나리오 자동화 완료!');
      console.log(`📍 컨트랙트 주소: ${contractAddress}`);
      console.log(`🔗 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
      
      console.log('\n💡 새로운 성취 사항:');
      console.log('   ✅ 배포자가 투표를 수동으로 종료');
      console.log('   ✅ 공식 결과를 블록체인에 영구 기록');
      console.log('   ✅ 명확한 승부 (4:3:1 비율)');
      console.log('   ✅ 상세한 결과 분석 및 보고서');
      console.log('   ✅ 이벤트 로그를 통한 투명한 결과 공개');
      
    } catch (error: any) {
      console.error('\n💥 향상된 시나리오 실패:', error.message);
      throw error;
    }
  }
}

// 실행
async function main() {
  const automation = new EnhancedVotingAutomation();
  await automation.runEnhancedScenario();
}

main().catch(console.error); 