// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;



//컨트랙트 변수 설명
//owner: 컨트랙트 소유자의 주소를 저장합니다.
//electionName: 선거 이름을 저장합니다.
//startTime: 선거 시작 시간을 저장합니다.
//endTime: 선거 종료 시간을 저장합니다.
//voters: 투표자 주소를 키로 하고 Voter 구조체를 값으로 가지는 매핑
//candidates: 후보자 ID를 키로 하고 candidate 구조체를 값으로 가지는 매핑
//candidateCount: 후보자 수를 저장합니다.
//totalVotes: 총 투표 수를 저장합니다.


//제한자 
//ownerOnly: 오직 소유자만 해당 함수를 호출할 수 있도록 제한합니다.
//duringVotingPeriod: 선거 기간 동안만 해당 함수를 호출할 수 있도록 제한합니다

//함수
//생성자함수 : electionName, startTime, endTime :초기화,thdbwk tjdwjd
//addCandidate:소유자가 후보자를 추가하는 함수입니다.
//authorize: 소유자가 투표자에게 권한을 부여하는 함수입니다.
//unauthorize: 소유자가 투표자에게 권한을 취소하는 함수입니다.
//vote: 투표자가 후보자에게 투표하는 함수입니다. 투표자는 권한이 부여되어 있어야 하며, 중복 튜표가 불가합니다
//end: 투표를 종료하고 결과를 반환하는 함수
//getCandidate: 특정 후보자의 정보를 조회하는 함수입니다.


//이벤트








contract Voting {
    //후보자 구조체 정의
    struct Candidate {
        uint id;         // 후보자 ID
        string name;     // 후보자 이름
        uint voteCount;  // 투표 수
    }

    //투표자 구조체 정의
    struct Voter {
        bool authorized; // 권한 여부
        bool voted;      // 투표 여부
        uint vote;       // 투표한 후보자 ID
    }


//컨트랙트 변수 설명
    address public owner;
    string public electionName; //선거 이름
    uint public startTime; //선거 시작 시간
    uint public endTime; //선거 종료 시간

    mapping(address => Voter) public voters; //투표자 주소를 키로 하고 Voter 구조체를 값으로 가지는 매핑
    mapping(uint => Candidate) public candidates; //후보자 ID를 키로 하고 candidate 구조체를 값으로 가지는 매필
     uint public candidateCount; //후보자 수
     uint public totalVotes; //총 투표 수

//제한자 설명
    modifier onlyOwner(){
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier duringVotingPeriod() {
        require(block.timestamp >= startTime, "Voting has not started yet");
        require(block.timestamp <= endTime, "Voting has ended");
        _;
    }

//생성자 함수 설명
    constructor(string memory _name, uint _votingDuration){ //생성자 함수 초기화
        owner = msg.sender; //소유자 주소 설정
        electionName = _name; //선거 이름 설정
        startTime = block.timestamp; //선거 시작 시간 설정
        endTime = block.timestamp + _votingDuration; //선거 종료 시간 설정
    }

    function addCandidate(string memory _name) public onlyOwner{ //후보자 추가 함수
        candidateCount++; //후보자 수 증가
        candidates[candidateCount] = Candidate(candidateCount, _name, 0); //후보자 추가
        emit CandidateAdded(candidateCount, _name);
    }

    function authorize(address _person) public onlyOwner { //권한 부여 함수
        require(!voters[_person].voted, "Person has already voted");
        voters[_person].authorized = true;
        emit VoterAuthorized(_person);
    }

    function unauthorize(address _person) public onlyOwner { //권한 취소 함수
        require(!voters[_person].voted, "Cannot unauthorize after voting");
        voters[_person].authorized = false;
        emit VoterUnauthorized(_person);
    }

    function vote(uint _candidateId) public duringVotingPeriod { //투표 함수
        require(voters[msg.sender].authorized, "Not authorized to vote");
        require(!voters[msg.sender].voted, "Already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");

        voters[msg.sender].voted = true;
        voters[msg.sender].vote = _candidateId;
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId);
    }

    function end() public onlyOwner view returns (string memory){ //투표 종료 함수
        require(block.timestamp > endTime, "Voting period has not ended yet");
        if (totalVotes == 0) {
            return "No votes cast";
        }
        
        uint winningVoteCount = 0;
        string memory winnerName = "";
        
        for (uint i = 1; i <= candidateCount; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winnerName = candidates[i].name;
            }
        }
        
        return string(abi.encodePacked("Winner: ", winnerName, " with ", uint2str(winningVoteCount), " votes"));
    }

    // Helper function to convert uint to string
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function getCandidate(uint _candidateId) public view returns (string memory, uint){ //후보자 정보 조회 함수
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.name, candidate.voteCount);
    }

    function getResults() public view returns (uint[] memory) {
        uint[] memory result = new uint[](candidateCount);
        for (uint i = 1; i <= candidateCount; i++) {
            result[i-1] = candidates[i].voteCount;
        }
        return result;
    }

    function getElectionStatus() public view returns (bool) {
        return block.timestamp <= endTime;
    }

    event VoteCast(address voter, uint candidateId);
    event CandidateAdded(uint candidateId, string name);
    event VoterAuthorized(address voter);
    event VoterUnauthorized(address voter);
}