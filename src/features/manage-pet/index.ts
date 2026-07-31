// manage-pet 슬라이스 공개 API — 바깥에서는 이 파일이 노출한 것만 import 한다.
//
// 등록·수정·삭제를 한 슬라이스에 둔다. 셋이 같은 폼(PetForm)을 쓰는데
// features 는 다른 feature 를 import 할 수 없어(features/README), 슬라이스를
// 행동별로 쪼개면 폼을 복제하거나 entities 로 내려야 한다. 후자는 폼이
// entities/species 의 SpeciesPicker 를 쓰기 때문에 entities 간 참조 금지에
// 다시 걸린다. 하나로 두는 편이 규칙과 실물 모두에 맞다.
//
// 바깥에는 화면이 바로 쓸 수 있는 조립본(CreatePetForm·EditPetForm)만 낸다.
// PetForm 자체는 mutation 이 없는 반쪽이라 슬라이스 밖에서는 쓸 일이 없다.
export { CreatePetForm } from "./ui/create-pet-form";
export { EditPetForm } from "./ui/edit-pet-form";
