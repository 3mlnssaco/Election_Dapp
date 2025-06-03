import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  rpcOptions: {
    alchemy: string;
  };
}

async function main() {
    console.log("🌍 Election DApp - 완전 통합 투표 결과 확인\n");
    
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
        // 🚀 1단계: 빠른 요약 결과 (simple_winner_check 기능)
        console.log("🚀 1단계: 빠른 승자 확인");
        console.log("=".repeat(60));
        
        // 후보자별 득표 확인
        const alice = await contract.getCandidate(1);
        const bob = await contract.getCandidate(2);
        const charlie = await contract.getCandidate(3);
        const totalVotes = await contract.totalVotes();
        
        console.log(`👑 Alice: ${alice[1]} 표`);
        console.log(`👔 Bob: ${bob[1]} 표`);
        console.log(`🎯 Charlie: ${charlie[1]} 표`);
        console.log(`📊 총 투표: ${totalVotes} 표`);
        
        // 승자 결정
        const votes = [
            { name: "Alice", count: alice[1].toNumber() },
            { name: "Bob", count: bob[1].toNumber() },
            { name: "Charlie", count: charlie[1].toNumber() }
        ];
        
        const winner = votes.reduce((prev, current) => 
            (prev.count > current.count) ? prev : current
        );
        
        console.log(`\n🏆 승자: ${winner.name} (${winner.count}표)`);
        
        // 투표 종료 확인
        const electionClosed = await contract.electionClosed();
        console.log(`📋 투표 상태: ${electionClosed ? "✅ 종료됨" : "🔄 진행 중"}`);
        
        // 📊 2단계: 상세 투표 결과 분석
        console.log("\n📊 2단계: 상세 투표 결과 분석");
        console.log("=".repeat(60));
        
        // 득표순 정렬
        const sortedCandidates = votes.sort((a, b) => b.count - a.count);
        
        // 상세 결과 출력
        sortedCandidates.forEach((candidate, index) => {
            const rank = index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉";
            const percentage = totalVotes.gt(0) ? 
                (candidate.count / totalVotes.toNumber() * 100).toFixed(1) : "0.0";
            const winnerMark = index === 0 ? " ← 승자!" : "";
            
            console.log(`${rank} ${candidate.name}: ${candidate.count}표 (${percentage}%)${winnerMark}`);
        });

        // 🔍 3단계: 상세 투표 내역 조회 (블록체인 이벤트 로그에서)
        console.log("\n🔍 3단계: 상세 투표 내역 조회");
        console.log("=".repeat(60));
        
        try {
            // 현재 블록 번호 가져오기
            const currentBlock = await provider.getBlockNumber();
            
            // 🎯 Alchemy API 제한에 맞춘 블록 범위 설정 (정확히 500블록)
            const blockRange = 500;
            const toBlock = currentBlock;
            const fromBlock = Math.max(0, currentBlock - blockRange + 1);
            
            console.log(`🔍 블록 조회 범위: ${fromBlock} ~ ${toBlock} (${toBlock - fromBlock + 1}블록)`);
            
            // VoteCast 이벤트 필터
            const voteCastFilter = contract.filters.VoteCast();
            const voteLogs = await contract.queryFilter(voteCastFilter, fromBlock, toBlock);
            
            console.log(`📋 총 ${voteLogs.length}개의 투표 기록이 블록체인에 영구 저장됨:\n`);
            
            if (voteLogs.length === 0) {
                console.log("💡 현재 블록 범위에서는 투표 기록이 없습니다.");
                console.log("🔄 더 넓은 범위 조회를 위해 여러 번 실행해보세요.");
                
                // 대안: 컨트랙트 배포 블록부터 조회 시도
                console.log("\n🔄 대안: 최근 1000블록을 100블록씩 나누어 조회:");
                
                let totalFound = 0;
                const smallRange = 100;
                
                for (let i = 0; i < 10; i++) {
                    const rangeFrom = Math.max(0, currentBlock - (i + 1) * smallRange);
                    const rangeTo = Math.max(0, currentBlock - i * smallRange);
                    
                    if (rangeFrom >= rangeTo) break;
                    
                    try {
                        const rangeLogs = await contract.queryFilter(voteCastFilter, rangeFrom, rangeTo);
                        if (rangeLogs.length > 0) {
                            console.log(`   📍 블록 ${rangeFrom}-${rangeTo}: ${rangeLogs.length}개 투표 발견`);
                            totalFound += rangeLogs.length;
                            
                            // 발견된 투표들 표시
                            for (const log of rangeLogs) {
                                const candidateInfo = await contract.getCandidate(log.args?.candidateId);
                                console.log(`      👤 ${log.args?.voter} → 🗳️ ${candidateInfo[0]}`);
                            }
                        }
                    } catch (rangeError) {
                        // 이 범위에서 에러가 나면 건너뛰기
                        continue;
                    }
                }
                
                console.log(`\n📊 총 발견된 투표: ${totalFound}개`);
                
            } else {
                // 정상적으로 투표 로그를 찾은 경우
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
            }
            
        } catch (logError) {
            console.log("❌ 이벤트 로그 조회 실패:", (logError as Error).message);
            console.log("💡 Etherscan Events 탭에서 직접 확인하세요!");
            console.log(`🔗 https://sepolia.etherscan.io/address/${contractAddress}#events`);
        }

        // 🏆 4단계: 공식 승자 발표 이벤트
        console.log("\n🏆 4단계: 공식 결과 발표 확인");
        console.log("=".repeat(60));
        
        try {
            const finalResult = await contract.finalResult();
            if (finalResult.announced) {
                console.log(`📢 공식 승자: ${finalResult.winnerName}`);
                console.log(`📊 승자 득표: ${finalResult.winnerVotes}표`);
                console.log(`📈 총 투표 수: ${finalResult.totalVotes}표`);
                console.log(`⏰ 발표 시간: ${new Date(finalResult.timestamp.toNumber() * 1000).toLocaleString()}`);
                console.log(`✅ 결과 발표됨: ${finalResult.announced ? "예" : "아니오"}`);
            } else {
                console.log("⏳ 공식 결과가 아직 발표되지 않았습니다.");
            }
        } catch (error) {
            console.log("⏳ 공식 결과가 아직 발표되지 않았습니다.");
        }
        
        // 🌍 5단계: 투명성 보장 및 확인 방법
        console.log("\n🌍 5단계: 완전한 투명성 보장");
        console.log("=".repeat(60));
        console.log("✅ 모든 투표 기록이 블록체인에 영구 저장됨");
        console.log("✅ 누구나 언제든지 검증 가능");
        console.log("✅ 투표자 주소와 선택 후보 모두 공개");
        console.log("✅ 변경 불가능한 투명한 결과");
        console.log("✅ 실시간 블록체인 데이터");
        
        console.log("\n🔗 Etherscan에서 확인 방법:");
        console.log(`   📱 컨트랙트 링크: https://sepolia.etherscan.io/address/${contractAddress}`);
        console.log(`   🔍 'Contract' → 'Events' 탭에서 모든 투표 이벤트 확인`);
        console.log(`   📋 'VoteCast' 이벤트: 개별 투표 내역`);
        console.log(`   🏆 'WinnerAnnounced' 이벤트: 공식 결과`);
        console.log(`   👥 'ElectionClosed' 이벤트: 투표 종료`);
        console.log(`   📊 Events의 'Alice' 텍스트가 승자를 나타냄`);
        
        // ⚠️ Verify 이슈 안내
        console.log("\n⚠️  Etherscan Verify 이슈:");
        console.log("   📝 '*** announceWinner()' 표시는 Verify 문제임");
        console.log("   ✅ 하지만 Events를 통해 모든 결과 확인 가능");
        console.log("   🎯 블록체인 데이터는 완전히 투명하고 정확함");
        
    } catch (error) {
        console.error("❌ 조회 실패:", error);
    }
    
    console.log("\n🎉 완전 통합 투표 결과 확인 완료!");
    console.log(`💡 모든 투표 트랜잭션을 Etherscan에서 개별적으로 확인할 수 있습니다!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 