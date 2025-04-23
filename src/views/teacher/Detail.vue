<template>
  <div class="container">
    <button @click="changeCommitModel">加载数据</button>
    <!-- 文章内容区域 -->
    <div class="article-content" @mouseup="handleTextSelection" v-html="annotatedContent"></div>

    <!-- 批注输入弹窗 -->
    <div v-if="showCommentInput" class="annotation-modal">
      <div class="selected-text">选中的文本：{{ selectedText }}</div>
      <textarea v-model="commentInput" placeholder="请输入批注内容"></textarea>
      <button @click="saveAnnotation">保存批注</button>
      <button @click="cancelAnnotation">取消</button>
    </div>
    <div v-if="CommitModel" class="annotation-modal">
      <h3>提交总结批注</h3>
      <textarea v-model="summaryContent" placeholder="请输入文章总结"></textarea>
      <button @click="submitSummary">确认提交</button>
      <button @click="()=>{CommitModel=false}">取消</button>
    </div>

    <!-- 批注展示 -->
    <div class="annotations-list">
      <div v-for="(annotation, index) in annotations" :key="index" class="annotation-item">
        <span class="highlight" @click="scrollToAnnotation(annotation)">
          {{ annotation.selectedText }}
        </span>
        <div class="comment">{{ annotation.comment }}</div>
      </div>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';
import { diff_match_patch } from '../../api/diff_match_patch'

export default {
  data() {
    return {
      articleContent: `这里是一篇示例文章内容，包含多个段落。教师可以选中任意文本片段进行批注。
          批注功能需要准确记录选中文本的位置和内容，并支持后续的展示和还原。`,
      annotations: [],
      selectedText: '',
      selectedRange: null,
      showCommentInput: false,
      commentInput: '',
      CommitModel: false,

    };
  },
  mounted() {
    this.loadData();
  },
  computed: {
    // 生成包含批注标记的内容
    annotatedContent() {
      let content = this.articleContent;
      this.annotations.forEach(anno => {
        const highlight = `<span class="highlight" data-id="${anno.id}">${anno.selectedText}</span>`;
        content = content.replace(anno.selectedText, highlight);
      });
      return content;
    },

    // 序列化批注信息
    serializedAnnotations() {
      return JSON.stringify(this.annotations);
    }
  },

  methods: {
    changeCommitModel() {
      console.log(this.CommitModel)
      this.CommitModel = true;
    },
    async submitSummary() {
      try{
        const jsonAnnotations = JSON.stringify(this.annotations);
        const response = await axios.post(
          'http://localhost:9251/api/marking/save',
          {
            docId: localStorage.getItem('docId'),
            modificationId: localStorage.getItem('modificationId'),
            markingWhat: this.summaryContent,
            marking: jsonAnnotations
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }catch(e) {
        console.log(e)
      }
    },
    async loadData() {
      try {
        // const response = await axios.get(
        //     'http://localhost:9251/api/modification/getDocByModificationId/6/10',
        // );
        // console.log(response);
        // this.patchText = response.data.modification
        const docId = localStorage.getItem('docId');
        console.log(docId)
        const response2 = await axios.get(
          'http://localhost:9251/api/docs/'+docId,
        );
        this.articleContent = response2.data.txt
        // console.log(response2);
        // console.log('原始补丁:', this.patchText)
        // console.log('原始文本', this.oldText)
        // const patches = this.dmp.patch_fromText(this.patchText)

        // // 应用补丁并验证结果
        // const [newText, results] = this.dmp.patch_apply(patches, this.oldText)
        // if (results.some(success => !success)) {
        //     throw new Error('部分补丁应用失败')
        // }

        // console.log('应用补丁后的新文本:', newText)

        // // 生成标准差异
        // const diffs = this.dmp.diff_main(this.oldText, newText)
        // this.dmp.diff_cleanupSemantic(diffs)  // 优化差异显示

        // console.log('标准差异:', !Array.isArray(diffs), !Array.isArray(diffs) || diffs.length < 2)
        // // 处理差异结果
        // this.generateLines(diffs)
        // // this.pagination.total = response.data.data.total || 0;
      } catch (error) {
        console.error('请求异常:', error);
        this.$message.error('数据加载失败');
      }
    },
    handleTextSelection() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        this.selectedRange = range;
        this.showCommentInput = true;
      }
    },

    saveAnnotation() {
      if (!this.commentInput) return;

      const newAnnotation = {
        id: Date.now(),
        selectedText: this.selectedText,
        comment: this.commentInput,
        startOffset: this.selectedRange.startOffset,
        endOffset: this.selectedRange.endOffset,
        startContainerPath: this.getNodePath(this.selectedRange.startContainer),
        endContainerPath: this.getNodePath(this.selectedRange.endContainer)
      };

      this.annotations.push(newAnnotation);
      this.clearSelection();
    },

    cancelAnnotation() {
      this.clearSelection();
    },

    clearSelection() {
      this.showCommentInput = false;
      this.commentInput = '';
      window.getSelection().removeAllRanges();
    },

    // 将DOM节点路径转换为可序列化的路径
    getNodePath(node) {
      const path = [];
      while (node.parentNode) {
        path.push(Array.prototype.indexOf.call(node.parentNode.childNodes, node));
        node = node.parentNode;
      }
      return path;
    },

    // 从序列化字符串加载批注
    loadAnnotations(serialized) {
      try {
        this.annotations = JSON.parse(serialized).map(anno => ({
          ...anno,
          range: this.restoreRange(anno)
        }));
      } catch (e) {
        console.error('解析批注失败:', e);
      }
    },

    // 还原Range对象
    restoreRange(annotation) {
      const range = document.createRange();

      let startNode = document.body;
      annotation.startContainerPath.reverse().forEach(index => {
        startNode = startNode.childNodes[index];
      });

      let endNode = document.body;
      annotation.endContainerPath.reverse().forEach(index => {
        endNode = endNode.childNodes[index];
      });

      range.setStart(startNode, annotation.startOffset);
      range.setEnd(endNode, annotation.endOffset);
      return range;
    },

    scrollToAnnotation(annotation) {
      const element = document.querySelector(`[data-id="${annotation.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
};
</script>
  
<style>
.container {
  display: flex;
  margin: 0 auto;
}

.article-content {
  flex: 2;
  padding: 20px;
  line-height: 1.6;
  border-right: 1px solid #ccc;
}

.annotations-list {
  flex: 1;
  padding: 20px;
}

.highlight {
  background-color: #ffeb3b;
  cursor: pointer;
}

.annotation-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.annotation-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
}
</style>