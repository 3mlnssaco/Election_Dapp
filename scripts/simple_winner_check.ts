import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  rpcOptions: {
    alchemy: string;
  };
}

async function main() {
    console.log("🏆 간단한 승자 확인 - Events에서 보이는 Alice 검증\n");
    
    // 설정 로드
    const configPath = path.join(__dirname, '../../config/wallet-config.json');
    const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Provider 설정 (읽기 전용)
    const provider = new ethers.providers.JsonRpcProvider(config.rpcOptions.alchemy);
    
    // 현재 컨트랙트 주소
    const contractAddress = "0x760B04Bb33939a93C7B3B98F5AeC6CbE46D41A46";
    
    // 컨트랙트 아티팩트 로드
    const artifactPath = path.join(__dirname, '../artifacts/contracts/election.sol/Voting.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // 컨트랙트 연결 (읽기 전용)
    const contract = new ethers.Contract(contractAddress, artifact.abi, provider);
    
    console.log(`📋 컨트랙트: ${contractAddress}`);
    console.log(`🌍 Etherscan: https://sepolia.etherscan.io/address/${contractAddress}\n`);
    
    try {
        console.log("🗳️ 빠른 결과 확인:");
        console.log("=".repeat(50));
        
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
        
        // 공식 결과 확인
        try {
            const finalResult = await contract.finalResult();
            if (finalResult.announced) {
                console.log(`\n🎉 공식 발표: ${finalResult.winnerName} 승리!`);
                console.log(`📈 득표: ${finalResult.winnerVotes}/${finalResult.totalVotes}표`);
            }
        } catch (e) {
            console.log("\n⏳ 공식 결과 아직 미발표");
        }
        
        console.log("\n🔍 Etherscan에서 확인 방법:");
        console.log("1. Contract 탭 → Events 탭 클릭");
        console.log("2. 'VoteCast' 이벤트에서 투표 내역 확인");
        console.log("3. 'WinnerAnnounced' 이벤트에서 공식 결과 확인");
        console.log("4. Events의 'Alice' 텍스트가 승자를 나타냄");
        
    } catch (error) {
        console.error("❌ 조회 실패:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 