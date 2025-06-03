import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  rpcOptions: {
    alchemy: string;
  };
}

async function main() {
    console.log("🌍 Election DApp - 완전 투명한 투표 결과 확인\n");
    
    // 설정 로드
    const configPath = path.join(__dirname, '../../config/wallet-config.json');
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Provider 설정 (읽기 전용)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcOptions.alchemy);
    
    // 최신 컨트랙트 주소 (새로 배포됨!)
    const contractAddress = "0x760B04Bb33939a93C7B3B98F5AeC6CbE46D41A46";
    
    // 컨트랙트 아티팩트 로드
    const artifactPath = path.join(__dirname, '../artifacts/contracts/election.sol/Voting.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // 컨트랙트 연결 (읽기 전용)
    const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
    
    console.log(`📋 컨트랙트 주소: ${contractAddress}`);
    console.log(`🌍 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}\n`);
    
    try {
        // 📊 기본 투표 결과 확인
        console.log("🗳️ 투표 결과 요약:");
        console.log("=".repeat(60));
        
        const totalVotes = await contract.totalVotes();
        console.log(`📈 총 투표 수: ${totalVotes}표\n`);
        
        // 후보자별 득표
        let candidates: Array<{name: string, votes: number, percentage: string}> = [];
        
        for (let i = 1; i <= 3; i++) {
            const candidate = await contract.getCandidate(i);
            const percentage = totalVotes.gt(0) ? 
                (candidate[1].toNumber() / totalVotes.toNumber() * 100).toFixed(1) : "0.0";
            
            candidates.push({
                name: candidate[0],
                votes: candidate[1].toNumber(),
                percentage: percentage
            });
        }
        
        // 득표순 정렬
        candidates.sort((a, b) => b.votes - a.votes);
        
        // 결과 출력
        candidates.forEach((candidate, index) => {
            const rank = index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉";
            const winner = index === 0 ? " ← 승자!" : "";
            
            console.log(`${rank} ${candidate.name}: ${candidate.votes}표 (${candidate.percentage}%)${winner}`);
        });

        // 🔍 상세 투표 내역 조회 (블록체인 이벤트 로그에서)
        console.log("\n🔍 상세 투표 내역 (모든 투표 기록):");
        console.log("=".repeat(60));
        
        try {
            // 현재 블록 번호 가져오기
            const currentBlock = await provider.getBlockNumber();
            
            // VoteCast 이벤트 필터 (최근 500블록만)
            const voteCastFilter = contract.filters.VoteCast();
            const fromBlock = Math.max(0, currentBlock - 500);
            const voteLogs = await contract.queryFilter(voteCastFilter, fromBlock, "latest");
            
            console.log(`📋 총 ${voteLogs.length}개의 투표 기록이 블록체인에 영구 저장됨:\n`);
            
            for (let i = 0; i < voteLogs.length; i++) {
                const log = voteLogs[i];
                const voterAddress = log.args?.voter;
                const candidateId = log.args?.candidateId;
                
                // 후보자 이름 가져오기
                const candidateInfo = await contract.getCandidate(candidateId);
                const candidateName = candidateInfo[0];
                
                // 블록 정보 가져오기
                const block = await provider.getBlock(log.blockNumber);
                const timestamp = new Date(block.timestamp * 1000).toLocaleString();
                
                console.log(`📝 투표 ${i + 1}:`);
                console.log(`   👤 투표자: ${voterAddress}`);
                console.log(`   🗳️  선택: ${candidateName} (ID: ${candidateId})`);
                console.log(`   ⏰ 시간: ${timestamp}`);
                console.log(`   📋 트랜잭션: ${log.transactionHash}`);
                console.log(`   🧱 블록: ${log.blockNumber}`);
                console.log("");
            }
            
            // 투표자별 분석
            const voterAddresses = [...new Set(voteLogs.map(log => log.args?.voter))];
            console.log(`👥 실제 투표자 수: ${voterAddresses.length}명`);
            console.log(`🗳️  총 투표 수: ${voteLogs.length}표`);
            if (voterAddresses.length > 0) {
                console.log(`📈 투표율: ${((voteLogs.length / voterAddresses.length) * 100).toFixed(1)}%`);
            }
            
        } catch (logError) {
            console.log("❌ 이벤트 로그 조회 실패:", (logError as Error).message);
            console.log("💡 하지만 기본 투표 결과는 정상적으로 확인 가능합니다!");
        }

        // 🏆 공식 승자 발표 이벤트
        console.log("\n🏆 공식 결과 발표:");
        console.log("=".repeat(60));
        
        try {
            const finalResult = await contract.finalResult();
            console.log(`📢 공식 승자: ${finalResult.winnerName}`);
            console.log(`📊 승자 득표: ${finalResult.winnerVotes}표`);
            console.log(`📈 총 투표 수: ${finalResult.totalVotes}표`);
            console.log(`⏰ 발표 시간: ${new Date(finalResult.timestamp.toNumber() * 1000).toLocaleString()}`);
            console.log(`✅ 결과 발표됨: ${finalResult.announced ? "예" : "아니오"}`);
            
        } catch (error) {
            console.log("❌ 공식 결과가 아직 발표되지 않았습니다.");
        }

        // 투표 상태
        const electionClosed = await contract.electionClosed();
        console.log(`\n📋 투표 상태: ${electionClosed ? "종료됨" : "진행 중"}`);
        
        // 🌍 투명성 보장 메시지
        console.log("\n🌍 완전한 투명성 보장:");
        console.log("=".repeat(60));
        console.log("✅ 모든 투표 기록이 블록체인에 영구 저장됨");
        console.log("✅ 누구나 언제든지 검증 가능");
        console.log("✅ 투표자 주소와 선택 후보 모두 공개");
        console.log("✅ 변경 불가능한 투명한 결과");
        console.log("✅ 실시간 블록체인 데이터");
        
        console.log("\n🔗 더 자세한 확인 방법:");
        console.log(`   📱 Etherscan 컨트랙트: https://sepolia.etherscan.io/address/${contractAddress}`);
        console.log(`   🔍 Etherscan에서 'Contract' → 'Events' 탭에서 모든 투표 이벤트 확인 가능`);
        console.log(`   📋 VoteCast, WinnerAnnounced 등 모든 이벤트가 공개되어 있음`);
        
    } catch (error) {
        console.error("❌ 조회 실패:", error);
    }
    
    console.log("\n🎉 완전 투명한 결과 확인 완료!");
    console.log(`💡 모든 투표 트랜잭션을 Etherscan에서 개별적으로 확인할 수 있습니다!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 