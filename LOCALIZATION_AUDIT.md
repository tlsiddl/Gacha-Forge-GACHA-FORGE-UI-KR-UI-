# 가챠포지 한글화 소스 대조 기록 (v1.8.7)

## 확인한 원본
- Gacha Forge 공식 클라이언트 `packages/gacha-forge/client.js` (업로드된 v1.8.12 파일)
- 공식 서버 `packages/gacha-forge/server.mjs` (업로드된 파일)
- 통합 한글화 `extension.js`

## 동작 구조별 번역 경로
| 공식 표시 방식 | 예시 | 통합 확장 처리 |
|---|---|---|
| 고정 UI 레이블 | 설정, 이미지 생성, 이벤트 메뉴 | `sourceScreenLabels`, `sourceSystemExact` |
| 홈 다음 단계 카드 | Level up / 600 XP held | `patchNextStep`에서 `.hm-next`를 직접 검사 |
| 숫자형 업적·임무 조건 | Clear 12 combat nodes | `sourceProgressTranslation` |
| 전투 스킬 설명 | Sweeps one enemy row… | `sourceMechanicTranslation` |
| 전투 상태·패시브 | Attack up, passive, rounds left | `combatTranslation` |
| AI 생성 스토리 | 캐릭터 대사·서사 | 고정 UI 치환 대상에서 제외 |

## 회귀 테스트 (v1.8.7)
- [x] `Clear 12 combat nodes` → `전투 노드 12회 클리어`
- [x] `Spend 300 Vigor` → `활력 300 소모`
- [x] `Summon 10 times` → `소환 10회 진행`
- [x] 궁극기 예제 `123%`/`304.5%`/`12/100` 보존 및 한국어 문장 생성
- [x] 통합 `extension.js` JavaScript 문법 파싱
- [ ] 실제 가챠포지 모든 화면의 DOM 번역 결과 검증
- [ ] 사용자 생성 이름·스토리 보존 전수 테스트
- [ ] 원본 업데이트에 따른 신규/수정 문자열 자동 차이 분석

## 확인 범위와 한계
본 기록은 업로드한 공식 소스와 통합 확장에서 확인할 수 있는 고정 UI 및 일부 조합형 텍스트를 기준으로 작성했습니다. 모든 가능한 문구가 번역되었다는 뜻은 아닙니다. 테스트는 함수 수준이며 브라우저의 실제 화면·모바일 환경 테스트는 별도로 필요합니다.

## 배포
GitHub 확장 관리자에서 이 저장소의 `manifest.json`을 통해 최신 버전을 설치하고, 원본·보완판 확장이 동시에 활성화되지 않도록 확인해 주세요.
