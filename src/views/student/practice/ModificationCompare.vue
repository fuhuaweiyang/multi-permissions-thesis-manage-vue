<template>
  <div>
    <el-switch v-model="showDiff" class="ml-2" inline-prompt
      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="论文版本显示" inactive-text="论文批注显示" />
    <div v-if="showDiff" class="diff-page">
      <!-- 旧版本 -->
      <div class="diff-column">
        <div class="header">旧版本</div>
        <div v-for="(line, index) in oldLines" :key="'old-' + index" class="line"
          :class="{ 'deleted': line.type === 'removed' }">
          <span class="line-number">{{ line.oldNum || ' ' }}</span>
          <span class="content">{{ line.content }}</span>
        </div>
      </div>

      <!-- 新版本 -->
      <div class="diff-column">
        <div class="header">新版本</div>
        <div v-for="(line, index) in newLines" :key="'new-' + index" class="line"
          :class="{ 'added': line.type === 'added' }">
          <span class="line-number">{{ line.newNum || ' ' }}</span>
          <span class="content">{{ line.content }}</span>
        </div>
      </div>
    </div>
    <div v-else class="container">
      <!-- 文章内容区域 -->
      <div class="article-content" @mouseup="handleTextSelection" v-html="annotatedContent"></div>
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
  </div>
</template>
  
<script>
import { diff_match_patch } from '../../../api/diff_match_patch'
import axios from 'axios';

export default {
  data() {
    return {
      dmp: new diff_match_patch(),
      oldText: '原始文本内容\n第二行原始内容\n第三行原始内容',
      patchText: '@@ -1,3 +1,4 @@\n 原始文本内容\n-第二行原始内容\n+第二行修改后的内容\n+新增的第四行内容\n 第三行原始内容\n',
      oldLines: [],
      newLines: [],
      showDiff: true,
      articleContent: `这里是一篇示例文章内容，包含多个段落。教师可以选中任意文本片段进行批注。
          批注功能需要准确记录选中文本的位置和内容，并支持后续的展示和还原。`,
      annotations: [],
      selectedText: '',
      selectedRange: null,
      commentInput: '',
    }
  },
  mounted() {
    this.loadData()
    this.processDiff()

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
    async loadData() {
      try {
        const modification = JSON.parse(localStorage.getItem('modification'))
        console.log(modification)
        const response = await axios.get(
          'http://localhost:9251/api/modification/getDocByModificationId/' + modification.docId + '/' + modification.id,
        );
        console.log(response);
        this.patchText = response.data.modification
        const response2 = await axios.get(
          'http://localhost:9251/api/docs/' + modification.docId,
        );
        this.oldText = response2.data.txt
        this.articleContent = response2.data.txt
        console.log(response2);
        console.log('原始补丁:', this.patchText)
        console.log('原始文本', this.oldText)
        const patches = this.dmp.patch_fromText(this.patchText)
        try {
          const response3 = await axios.get(
            'http://localhost:9251/api/marking/getByDocId/' + modification.docId,
          );
          console.log(modification.docId);
          console.log(response3)
          this.annotations = JSON.parse(response3.data.marking)
        } catch (error) {
          console.log(error)
        }
        console.log(this.annotations)
        // 应用补丁并验证结果
        const [newText, results] = this.dmp.patch_apply(patches, this.oldText)
        if (results.some(success => !success)) {
          throw new Error('部分补丁应用失败')
        }

        // console.log('应用补丁后的新文本:', newText)

        // 生成标准差异
        const diffs = this.dmp.diff_main(this.oldText, newText)
        this.dmp.diff_cleanupSemantic(diffs)  // 优化差异显示

        console.log('标准差异:', !Array.isArray(diffs), !Array.isArray(diffs) || diffs.length < 2)
        // 处理差异结果
        this.generateLines(diffs)
        // this.pagination.total = response.data.data.total || 0;
      } catch (error) {
        console.error('请求异常:', error);
        this.$message.error('数据加载失败');
      }
    },
    // async processDiff() {
    //     try {
    //         // 解析补丁
    //         console.log('原始补丁:', this.patchText)
    //         console.log('原始文本', this.oldText)
    //         const patches = this.dmp.patch_fromText(this.patchText)

    //         // 应用补丁并验证结果
    //         const [newText, results] = this.dmp.patch_apply(patches, this.oldText)
    //         if (results.some(success => !success)) {
    //             throw new Error('部分补丁应用失败')
    //         }

    //         console.log('应用补丁后的新文本:', newText)

    //         // 生成标准差异
    //         const diffs = this.dmp.diff_main(this.oldText, newText)
    //         this.dmp.diff_cleanupSemantic(diffs)  // 优化差异显示

    //         console.log('标准差异:', !Array.isArray(diffs), !Array.isArray(diffs) || diffs.length < 2)
    //         // 处理差异结果
    //         this.generateLines(diffs)
    //     } catch (error) {
    //         console.error('处理差异失败:', error)
    //         this.$message.error(`版本对比失败: ${error.message}`)
    //     }
    // },

    generateLines(diffs) {
      let oldLineNum = 1
      let newLineNum = 1
      const oldLines = []
      const newLines = []

      console.log(diffs)
      // 安全遍历差异
      diffs.forEach(diff => {
        // 添加类型检查
        // if (!Array.isArray(diff) || diff.length < 2) 
        // {
        //     console.log('未安全通过类型检查', diff)
        //     return
        // }
        // console.log('安全通过类型检查', diff[0])

        const type = diff[0]
        const content = diff[1]


        // console.log('处理差异:', content)
        // console.log('this.dmp.DIFF_DELETE:', this.dmp.DIFF_DELETE)
        // console.log('this.dmp.DIFF_INSERT:', this.dmp.DIFF_INSERT)
        // console.log('this.dmp.DIFF_EQUAL:', this.dmp.DIFF_EQUAL)
        const lines = content.split('\n').filter(l => l !== '')

        console.log('处理差异:', lines)
        switch (type) {
          case 1:
            oldLines.push({
              content: content,
              oldNum: oldLineNum++,
              type: 'removed'
            })
            newLines.push({ type: 'empty' })
            break

          case -1:
            newLines.push({
              content: content,
              newNum: newLineNum++,
              type: 'added'
            })
            oldLines.push({ type: 'empty' })
            break

          default:  // DIFF_EQUAL
            oldLines.push({
              content: content,
              oldNum: oldLineNum++,
              type: 'same'
            })
            newLines.push({
              content: content,
              newNum: newLineNum++,
              type: 'same'
            })
        }
      })
      this.oldLines = oldLines
      this.newLines = newLines
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
}
</script>
  
<style scoped>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: auto;
}

div {
  box-sizing: border-box;
}

:host {
  display: block;
  height: 100%;
}

.diff-page,
.container {
  overflow-y: auto;
  max-height: 90vh;
}

.diff-page {
  display: flex;
  gap: 20px;
  padding: 20px;
  font-family: monospace;
}

.diff-column {
  flex: 1;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
}

.header {
  padding: 10px;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  font-weight: bold;
}

.line {
  display: flex;
  padding: 2px 10px;
}

.line-number {
  min-width: 40px;
  color: rgba(27, 31, 35, .3);
  padding-right: 10px;
  user-select: none;
}

.deleted {
  background-color: #ffeef0;
}

.added {
  background-color: #e6ffed;
}

.content {
  white-space: pre-wrap;
}

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