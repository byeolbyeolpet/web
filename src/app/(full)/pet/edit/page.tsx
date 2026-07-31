// 펫 수정 라우트 (/pet/edit?id=...) — views/pet-edit 위임.
//
// 동적 세그먼트가 아니라 쿼리스트링인 이유는 views/pet-edit 헤더 주석 참고
// (Static Export 는 빌드 시점에 없던 id 를 404 로 낸다).
import { PetEditView } from "@/views/pet-edit";

export default function Page() {
  return <PetEditView />;
}
