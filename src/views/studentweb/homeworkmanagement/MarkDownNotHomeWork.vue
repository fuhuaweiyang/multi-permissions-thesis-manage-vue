<template>
    <div style="padding: 20px;">
      <el-button type="danger" @click="goOthers()">返回</el-button>
      <el-button type="success" @click="submit">提交</el-button>
  
      <el-input 
        v-model="homeworkData.title" 
        placeholder="请输入标题" 
        style="margin-bottom: 10px;"
      ></el-input>
      <el-input
        v-model="homeworkData.content"
        placeholder="请输入内容"
        type="textarea"
        style="margin-bottom: 10px;"
      ></el-input>
  
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :multiple="true"
        :on-change="handleFileChange"
        :before-remove="handleFileRemove"
        ref="uploadRef"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持500kb以下的doc/docx文件
          </div>
        </template>
      </el-upload>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
import jsCookie from 'js-cookie';
  
  export default {
    data() {
      return {
        homeworkData: {
          title: '',
          content: ''
        },
        fileList: []
      };
    },
    methods: {
      goOthers() {
        // 你的返回逻辑
      },
      
      handleFileChange(file, fileList) {
        // 验证文件格式和大小
        const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const isDoc = validTypes.includes(file.raw.type) || 
                     file.raw.name.endsWith('.doc') || 
                     file.raw.name.endsWith('.docx');
        const isLt500KB = file.raw.size / 1024 < 500;
  
        if (!isDoc) {
          this.$message.error('只能上传doc/docx格式文件');
          return false;
        }
        if (!isLt500KB) {
          this.$message.error('文件大小不能超过500KB');
          return false;
        }
  
        this.fileList = fileList;
        return false;
      },
  
      handleFileRemove(file, fileList) {
        this.fileList = fileList;
      },
  
      async submit() {
        // 验证表单数据
        if (!this.homeworkData.title.trim()) {
          this.$message.error('请输入标题');
          return;
        }
        if (!this.homeworkData.content.trim()) {
          this.$message.error('请输入内容');
          return;
        }
        if (this.fileList.length === 0) {
          this.$message.error('请选择要上传的文件');
          return;
        }
  
        // 构造表单数据
        const formData = new FormData();
        formData.append('title', this.homeworkData.title);
        formData.append('content', this.homeworkData.content);
        formData.append('userId', jsCookie.get('userId'));
        this.fileList.forEach(file => {
          formData.append('files', file.raw);
        });


        try {
          const response = await axios.post('http://localhost:9251/api/docs/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          this.$message.success('提交成功');
          // 清空表单
          this.homeworkData = { title: '', content: '' };
          this.fileList = [];
          this.$refs.uploadRef.clearFiles();
          
          // 这里可以添加提交成功后的其他逻辑
        } catch (error) {
          this.$message.error('提交失败');
          console.error('上传错误:', error);
        }
      }
    }
  };
  </script>