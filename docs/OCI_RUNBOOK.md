# OCI_RUNBOOK (담당: 정민)

비밀값(키 파일, 비밀번호, 접속 문자열)은 이 문서에 적지 않는다. 위치만 적는다.
`[검증됨]` 은 10/14 리허설(Oracle Linux, 메모리 500MB VM)에서 확인한 것, `[미검증]` 은 아직 해보지 않은 것이다.

## 0. 대회 당일 아침에 먼저 확인 (주최 측 자원)
| 확인 | 왜 | 어떻게 |
|---|---|---|
| OS 종류·버전, 접속 사용자 | 설치 명령이 다르다 (아래 2절) | `cat /etc/os-release` / Oracle Linux 는 `opc`, Ubuntu 는 `ubuntu` |
| sudo 권한 | Docker 설치에 필요 | `sudo -v` |
| 메모리·CPU | 2GB 미만이면 스왑부터 | `free -h`, `nproc` |
| Docker 설치 여부 | 설치 단계를 건너뛸 수 있음 | `docker --version`, `docker compose version` |
| 공인 IP, 80/443 을 우리가 열 수 있는가 | Security List 권한이 없으면 주최 측에 요청 | 콘솔 접근 권한 확인 |
| Autonomous DB 를 누가 만드는가 | 무료 ADB 는 계정당 2개 한도 | 주최 측에 확인 |
| OpenAI 키 수령 | **리허설에서 검증하지 못한 유일한 경로** | 받자마자 6절 순서대로 `/api/ai-example` 확인 |

## 리소스 (당일 채움)
| 항목 | 값 |
|---|---|
| 리전 | |
| VM | OS: / 사용자: / Shape: / 메모리: |
| 공인 IP | |
| SSH 키 위치 | 정민 노트북 `C:\Users\<이름>\.ssh\` |
| Autonomous DB | 이름: / 접속 정보: VM `deploy/.env` |

## 1. 접속
```bash
ssh -i ~/.ssh/<키파일>.key <사용자>@<공인IP>      # Git Bash
```
- 시간 초과: 인스턴스 RUNNING 인지, 공용 서브넷인지, Security List 22번 확인
- 회사·학교 네트워크가 22번을 막으면: 휴대폰 핫스팟 `[미검증]`
- Shape 변경은 재부팅을 일으킨다. 대회 중에는 하지 않는다
- 붙여 넣기는 Git Bash 창에서 마우스 오른쪽 클릭 또는 `Shift+Insert`. 한글 입력 상태에서 붙여 넣으면 글자가 섞인다
- PC 터미널에서 `sudo` 를 치면 Windows 가 응답한다. **VM 에 접속한 뒤** 실행할 것

## 2. 최초 세팅 (VM, 한 번만)

### 2-1. 스왑 (메모리 2GB 미만이면 필수) `[검증됨]`
메모리가 작으면 dnf/apt 와 이미지 빌드가 멈춘다. Docker 설치 **전에** 한다.
```bash
sudo dd if=/dev/zero of=/swapfile2 bs=1M count=4096 status=progress
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
free -h          # Swap total 이 4G 이상
```

### 2-2. Oracle Linux `[검증됨]`
```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin   # 충돌 시 --allowerasing
sudo systemctl enable --now docker
sudo usermod -aG docker opc
exit                                   # 다시 접속해야 그룹이 적용된다
docker run --rm hello-world && docker compose version

sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --list-services      # http https 가 보여야 함
```
- 메모리 500MB VM 에서 dnf 첫 실행은 수 분간 출력이 없다. 끊지 말고 새 창에서 `top` 으로 진행 여부를 본다.

### 2-3. Ubuntu `[미검증]`
```bash
sudo apt-get update
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit                                   # 다시 접속
docker run --rm hello-world && docker compose version

# OCI 의 Ubuntu 이미지는 ufw 가 꺼져 있어도 iptables 가 22번 외 포트를 막는다
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```
- "VM 안에서는 되는데 밖에서는 안 된다" 면 거의 이 iptables 문제다.

### 2-4. OCI 콘솔: Security List `[검증됨]`
인스턴스 → Primary VNIC 의 Subnet → Security Lists → Ingress Rules → Add
- Source CIDR `0.0.0.0/0`, Protocol TCP, **Source Port Range 는 비움**, **Destination Port Range `80`** (같은 방식으로 `443`)
- 리허설 때 포트를 Source Port 칸에 넣어 외부 접속이 전부 막혔다. 표에서 `80` 이 Destination 열에 보이는지 확인할 것.
- 서브넷에 NSG 가 붙어 있으면 NSG 에도 같은 규칙이 필요하다.

## 3. 저장소 받기 `[검증됨]`
```bash
git --version || sudo dnf install -y git        # Ubuntu 는 기본 설치
git clone https://github.com/OracleHackerthon/<저장소>.git
cd <저장소>
cp .env.example deploy/.env
chmod +x deploy/deploy.sh
```
- 공개 저장소라 Deploy Key 없이 clone 된다. VM 의 저장소에서는 push 하지 않는다 (권한 없음).
- `deploy/.env` 수정은 `vi deploy/.env` → `i` 로 입력 → `Esc` → `:wq`. 값에 따옴표를 붙이지 않는다.
- OpenAI 키와 DB 값이 비어 있어도 `/api/health` 는 동작한다. 배포 경로부터 먼저 확인한다.

## 4. 배포 `[검증됨]`
```bash
cd ~/<저장소> && ./deploy/deploy.sh
```
- `git pull` → ai, web 순서로 이미지 빌드 → 실행 → `/api/health` 확인까지 자동. 마지막 줄 `배포 완료: <커밋>`
- **첫 빌드 시간**: 메모리 500MB + 스왑 4GB VM 에서 약 30분. 메모리 2GB 이상이면 훨씬 짧다 `[미검증]`
- SSH 가 끊겨도 계속되게: `nohup ./deploy/deploy.sh > deploy.log 2>&1 & tail -f deploy.log`
- 확인: 브라우저 `http://<공인IP>/api/health` → `{"ok":true,"data":{"web":"up","ai":"up"}}`
- 주소창에 `http://` 를 직접 쓴다. 브라우저가 https 로 바꾸면 연결 실패로 보인다

## 5. Autonomous DB 연결 (지갑 없는 TLS) `[검증됨]`
**생성** (Oracle Database → Autonomous Database → Create)
- Workload: Transaction Processing / Always Free 켬 / 버전 23ai
- Network access: Secure access from allowed IPs and VCNs only → VM 공인 IP 추가
- **Require mutual TLS (mTLS): 해제** (지갑 없이 접속하려면 필수)
- 실패 `adb-free-count` 초과: 무료 ADB 는 계정당 2개(중지된 것도 포함, 홈 리전만). 다른 Compartment 의 기존 DB 를 확인

**접속 문자열**: Database connection → TLS authentication 을 **TLS** → `<db이름>_low` 의 Connection string 복사 (`(description=...` 로 시작하는 한 줄)

**VM `deploy/.env`**
```
DB_USER=ADMIN
DB_PASSWORD=<생성 때 정한 비밀번호>
DB_CONNECT_STRING=<복사한 문자열, 따옴표 없이>
```
```bash
docker compose -f deploy/docker-compose.yml up -d --force-recreate web
curl -s http://localhost/api/db-check     # {"ok":true,"data":{"result":1}}
```
- 시간 초과: ACL 에 VM IP 가 없음 (VM 공인 IP 가 바뀌면 ACL 도 갱신)
- 접속 거부: mTLS 가 아직 필수 (변경 반영에 1~2분)
- `ORA-01017`: 비밀번호 틀림
- 원인 로그: `docker compose -f deploy/docker-compose.yml logs --tail 20 web`

### 5-1. 앱 전용 사용자, 노트북 접속, 테이블 생성 `[미검증]`
ADMIN 은 DB 전체 권한이다. 앱(VM)과 영진 노트북은 **APP 사용자**로 접속하고, ADMIN 비밀번호는 정민만 갖는다 (DECISIONS D1).

**APP 사용자 만들기** (ADB 상세 → Database actions → SQL, ADMIN 으로 로그인, 한 번만)
```sql
CREATE USER APP IDENTIFIED BY "<비밀번호>";   -- 12~30자, 대문자·소문자·숫자 포함, 큰따옴표 금지
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO APP;
ALTER USER APP QUOTA UNLIMITED ON DATA;
-- APP 이 Database Actions(웹 SQL 편집기)에 로그인할 수 있게 한다
BEGIN
  ORDS_ADMIN.ENABLE_SCHEMA(p_enabled => TRUE, p_schema => 'APP',
    p_url_mapping_type => 'BASE_PATH', p_url_mapping_pattern => 'app', p_auto_rest_auth => TRUE);
END;
/
```
- VM `deploy/.env` 의 `DB_USER`/`DB_PASSWORD` 를 APP 으로 바꾸고 `up -d --force-recreate web` → `/api/db-check`

**영진 노트북에서 접속 (대회 당일)**
1. 대회장 와이파이의 공인 IP 확인 (영진 노트북 브라우저에서 "what is my ip")
2. ADB → More actions → Update network access → ACL 에 그 IP 추가 (VM IP 는 그대로 둔다). 반영 1~2분
3. 영진에게 `DB_USER=APP`, 비밀번호, 접속 문자열을 **직접** 전달 (팀 채팅에 올리지 않음). 영진은 `web/.env.local` 에만 넣는다
4. 영진이 `npm run dev` → `http://localhost:3000/api/db-check` 확인
- 와이파이·핫스팟을 바꾸면 IP 가 바뀐다. 접속이 시간 초과로 실패하면 1~2를 다시 한다
- OCI 계정은 필요 없다. DB 사용자 정보와 ACL 만 있으면 된다

**테이블 생성 (`web/db/schema.sql` 이 머지될 때마다)**
- Database actions → SQL 에 **APP 으로 로그인** → 새로 추가된 문장만 붙여 넣고 Run Script(F5)
- 이미 실행한 문장은 다시 돌리지 않는다. 변경은 `ALTER TABLE` 로 추가된다

## 6. OpenAI 연결 `[미검증]`
```
OPENAI_API_KEY=<주최 측 키>
OPENAI_MODEL=gpt-5-mini
```
```bash
docker compose -f deploy/docker-compose.yml up -d --force-recreate ai
curl -s -X POST http://localhost/api/ai-example -H "Content-Type: application/json" -d '{"text":"테스트 문장입니다"}'
```
- 실패하면 `docker compose -f deploy/docker-compose.yml logs --tail 30 ai` (키 오류 401, 모델 이름 오류 404, 한도 429)

## 7. 롤백
```bash
git fetch --tags && git checkout ok-<마지막 정상 시각>
docker compose -f deploy/docker-compose.yml up -d --build
git checkout main            # 복구 후 다음 deploy.sh 의 git pull 을 위해
```
정상 배포마다 **정민 PC에서** 태그를 단다:
`git fetch origin && git tag ok-<MMDD-HHMM> origin/main && git push origin ok-<MMDD-HHMM>`

## 8. 장애 체크리스트 (안쪽부터)
1. `docker compose -f deploy/docker-compose.yml ps` — web, ai, caddy 가 모두 Up 인가. 비어 있으면 `deploy.sh` 가 실행되지 않았거나 실패한 것
2. `docker compose -f deploy/docker-compose.yml logs --tail 50 web` (또는 `ai`, `caddy`)
3. `curl -s localhost/api/health` — VM 안에서 되는가. **되면 바깥(방화벽, Security List) 문제**
4. VM 방화벽: Oracle Linux `sudo firewall-cmd --list-services` / Ubuntu `sudo iptables -L INPUT -n | head`
5. Security List: 80, 443 이 **Destination Port** 에 있는가
6. `ai: down` — ai 로그, `OPENAI_API_KEY`
7. db-check 실패 — 5절의 원인 목록
8. VM 이 응답 없음 — 콘솔에서 Reboot (5~15분). 그동안 로컬 실행으로 시연 준비

## 9. HTTPS `[미검증]`
`deploy/.env` 의 `SITE_ADDRESS` 를 `<IP를-하이픈으로>.sslip.io` 로 바꾸고 `up -d --force-recreate caddy`. Caddy 가 인증서를 자동 발급한다.
주제가 마이크·카메라·위치 같은 브라우저 기능을 쓰면 HTTPS 가 필요하다. sslip.io 발급이 실패하면 DuckDNS 같은 무료 서브도메인을 쓴다.
