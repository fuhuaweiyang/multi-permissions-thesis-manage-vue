import {post,get} from "../request";

export function addt(data) {
    return post('api/study/exercises/save',data)

}

export function addKnow(data) {
    return post('api/study/knowledgePoint/save',data)

}
export function saveTest(data) {
    return post('/api/study/knowledgePoint/update ', data)
}

export function saveHomework(data) {
    return post('/api/study/homework/save', data)  
}

export function updateExerciseScore(id, score) {
    return post('/api/study/userDoExercise/updateScore/' + id + "/" + score)  
}