<template>
  <div class="container">
    <!-- 添加学生按钮 -->
    <button class="add-btn" @click="showAddStudent = true">+ 添加新学生</button>

    <!-- 添加学生表单 -->
    <div v-if="showAddStudent" class="modal">
      <h3>添加新学生</h3>
      <input v-model="newStudent.name" placeholder="学生姓名">
      <button @click="addStudent">确认添加</button>
      <button @click="showAddStudent = false">取消</button>
    </div>

    <!-- 学生列表 -->
    <div class="student-list">
      <div v-for="student in students" :key="student.id" class="student-item">
        <!-- 学生信息 -->
        <div class="student-header" @click="togglePapers(student)">
          <span class="toggle-icon">{{ student.isExpanded ? '▼' : '▶' }}</span>
          <span class="student-name">{{ student.name }}</span>
          <button class="add-paper-btn" @click.stop="showAddPaper(student)">+ 添加论文</button>
        </div>

        <!-- 论文列表 -->
        <div v-show="student.isExpanded" class="paper-list">
          <div v-for="paper in student.papers" :key="paper.id" class="paper-item">
            <div class="paper-info">
              <span class="paper-title">{{ paper.title }}</span>
              <span :class="['status', paper.status]">{{ paper.statusText }}</span>
              <span class="score" v-if="paper.score">分数：{{ paper.score }}</span>
            </div>
            <div class="paper-meta">
              <span>提交时间：{{ formatDate(paper.submitTime) }}</span>
              <button @click="editPaper(paper)">编辑</button>
              <button @click="deletePaper(student, paper)">删除</button>
            </div>
          </div>

          <!-- 添加论文表单 -->
          <div v-if="student.showAddPaper" class="paper-form">
            <input v-model="newPaper.title" placeholder="论文标题">
            <select v-model="newPaper.status">
              <option value="1">进行中</option>
              <option value="2">已提交</option>
              <option value="3">已评分</option>
            </select>
            <input v-model="newPaper.score" placeholder="分数" type="number">
            <button @click="addPaper(student)">保存</button>
            <button @click="cancelAddPaper(student)">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import Cookies from 'js-cookie'
import { tclassmanagemt, deleteStudent } from "../../api/teacher/teacherclass.js";

export default {
  data() {
    return {
      showAddStudent: false,
      page: {
        page: 1, //初始页
        pageSize: 10,    //    每页的数据
        userId: ''
      },
      students: [
        {
          id: 1,
          name: '张三',
          isExpanded: true,
          papers: [
            {
              id: 101,
              title: '人工智能在教育的应用研究',
              status: '3',
              score: 90,
              submitTime: '2023-03-15'
            }
          ]
        }
      ],
      newStudent: {
        name: ''
      },
      newPaper: {
        title: '',
        status: '1',
        score: null
      }
    }
  },

  computed: {
    statusText() {
      return {
        '1': '进行中',
        '2': '已提交',
        '3': '已评分'
      }
    }
  },
  created() {
    this.page.userId = Cookies.get('userId')
    this.listAllClass(this.page)
  },
  methods: {
    togglePapers(student) {
      student.isExpanded = !student.isExpanded
    },
    listAllClass(page) {
      tclassmanagemt(page).then(resp => {
        this.tableData = resp.data.resultData.data
        console.log(this.tableData)
      })
    },
    async getDate() {
      try {
        const response = await axios.get(
          'http://localhost:9251/api/modification/getDocByModificationId/6/10',
        );
      } catch (error) {
        console.error('请求异常:', error);
        this.$message.error('数据加载失败');
      }
    },

    showAddPaper(student) {
      this.$set(student, 'showAddPaper', true)
    },

    addStudent() {
      if (this.newStudent.name) {
        this.students.push({
          id: Date.now(),
          name: this.newStudent.name,
          isExpanded: false,
          papers: [],
          showAddPaper: false
        })
        this.showAddStudent = false
        this.newStudent.name = ''
      }
    },

    addPaper(student) {
      if (this.newPaper.title) {
        student.papers.push({
          id: Date.now(),
          ...this.newPaper,
          statusText: this.statusText[this.newPaper.status],
          submitTime: new Date().toISOString().slice(0, 10)
        })
        this.cancelAddPaper(student)
      }
    },

    cancelAddPaper(student) {
      student.showAddPaper = false
      this.newPaper = {
        title: '',
        status: '1',
        score: null
      }
    },

    deletePaper(student, paper) {
      const index = student.papers.findIndex(p => p.id === paper.id)
      student.papers.splice(index, 1)
    },

    editPaper(paper) {
      // 实现编辑逻辑
      console.log('编辑论文:', paper)
    },

    formatDate(dateString) {
      const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
      return new Date(dateString).toLocaleDateString('zh-CN', options)
    }
  }
}
</script>
  
<style>
.container {
  margin: 20px auto;
  padding: 20px;
}

.student-list {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.student-item {
  border-bottom: 1px solid #eee;
  padding: 15px;
}

.student-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  background-color: #f8f9fa;
}

.toggle-icon {
  margin-right: 10px;
}

.student-name {
  flex-grow: 1;
  font-weight: bold;
}

.add-paper-btn {
  margin-left: auto;
  padding: 5px 10px;
}

.paper-list {
  margin-left: 30px;
  padding: 10px;
}

.paper-item {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.paper-info {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.status {
  padding: 2px 5px;
  border-radius: 3px;
  margin-left: 10px;
  font-size: 0.9em;
}

.status[data-status="1"] {
  background: #ffd700;
}

.status[data-status="2"] {
  background: #87ceeb;
}

.status[data-status="3"] {
  background: #98fb98;
}

.score {
  margin-left: auto;
  color: #666;
}

.paper-meta {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
}

.modal,
.paper-form {
  padding: 15px;
  border: 1px solid #ccc;
  margin: 10px 0;
  background: white;
}

.add-btn {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button {
  margin: 0 5px;
  padding: 5px 10px;
  cursor: pointer;
}
</style>
