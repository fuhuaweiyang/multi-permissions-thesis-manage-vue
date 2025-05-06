<template>
  <div>
    <div style="position: fixed; left: 50%; transform: translateX(-50%); margin: 10px; z-index: 10;">
      <el-switch v-model="showDiff" class="ml-2" inline-prompt
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;" active-text="论文版本显示"
        inactive-text="新版本论文批注显示" />
    </div>
    <div style="margin-top: 40px;">
      <div v-if="showDiff" class="diff-page-wrapper">
        <!-- 新旧版本对比区（占比 60%） -->
        <div class="diff-page">
          <!-- 旧版本 -->
          <div class="diff-column">
            <div class="header">旧版本</div>
            <div class="lines">
              <span v-for="(line, index) in oldLines" :key="'old-' + index" class="line"
                :class="{ deleted: line.type === 'removed' }">
                <div v-if="line.type === 'enter'"><br /></div>
                <span v-else class="content">{{ line.content }}</span>
              </span>
            </div>
          </div>
          <!-- 新版本 -->
          <div class="diff-column">
            <div class="header">新版本</div>
            <div class="lines">
              <span v-for="(line, index) in newLines" :key="'new-' + index" class="line"
                :class="{ added: line.type === 'added' }">
                <div v-if="line.type === 'enter'"><br /></div>
                <span v-else class="content">{{ line.content }}</span>
              </span>
            </div>
          </div>
        </div>
        <!-- 旧版本批准查看区（占比 30%） -->
        <!-- 旧版本批准查看区（占比 30%），展示旧版本批注 comment -->
        <div class="comparison-result">
          <div class="header">旧版本批准查看</div>
          <div class="comparison-body">
            <div v-for="anno in annotations" :key="anno.id" class="annotation-item">
              <!-- 只展示 comment，点击后滚动到旧版本 diff 中对应 selectedText -->
              <span class="highlight" @click="scrollToOld(anno)">{{ anno.comment }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- 论文批注显示 -->
      <div v-else class="container">
        <div class="article-content" @mouseup="handleTextSelection" v-html="annotatedContent"></div>
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
    scrollToOld(annotation) {
      const contentEls = this.$el.querySelectorAll('.diff-page .diff-column:first-child .content');
      for (const el of contentEls) {
        if (el.textContent.includes(annotation.selectedText)) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('temp-highlight');
          setTimeout(() => el.classList.remove('temp-highlight'), 2000);
          break;
        }
      }
    },
    async loadData() {
      try {
        const modification = JSON.parse(localStorage.getItem('modification'))
        const prevModification = JSON.parse(localStorage.getItem('prevModification'))
        console.log(modification)
        const response = await axios.get(
          'http://localhost:9251/api/modification/getDocByModificationId/' + modification.docId + '/' + modification.id,
        );
        const modificationList = response.data.resultData
        this.patchText = response.data.modification
        console.log(modificationList)
        const response2 = await axios.get(
          'http://localhost:9251/api/docs/' + modification.docId,
        );
        this.oldText = response2.data.txt
        let newText = response2.data.txt
        this.articleContent = response2.data.txt
        try {
          const response3 = await axios.get(
            'http://localhost:9251/api/marking/getByModificationId/' + prevModification.id,
          );
          this.annotations = JSON.parse(response3.data.marking)
          console.log('this.annotations')
          console.log(this.annotations)
        } catch (error) {
          console.log(error)
        }
        for (let i = modificationList.length - 1; i >= 0; i--) {
          const data = modificationList[i];
          const patches = this.dmp.patch_fromText(data.modification);
          const [nextText, results] = this.dmp.patch_apply(patches, newText);
          this.oldText = newText
          newText = nextText;
          if (results.some(success => !success)) {
            throw new Error('部分补丁应用失败');
          }
        }
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
    generateLines(diffs) {
      let oldLineNum = 1
      let newLineNum = 1
      const oldLines = []
      const newLines = []

      console.log(diffs)
      // 安全遍历差异
      diffs.forEach(diff => {
        const type = diff[0]
        const content = diff[1]

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
      this.oldLines = this.splitByNewline(this.oldLines)
      this.newLines = this.splitByNewline(this.newLines)
    },
    splitByNewline(items) {
      const result = [];
      let counter = 0;

      // 如果输入数组中已有 newNum，就从最大的开始+1，否则从1开始
      if (items.length > 0) {
        const maxNum = Math.max(...items.map(it => it.newNum));
        counter = maxNum + 1;
      } else {
        counter = 1;
      }

      // 正则：匹配所有换行表现
      const newlineRe = /(\r\n|\r|\n)/;

      items.forEach(item => {
        const { content, type } = item;

        // 如果内容中没有换行，直接原封不动推入
        if (!newlineRe.test(content)) {
          result.push({ content, newNum: counter++, type });
          return;
        }

        // 否则先按换行分割并保留分隔符
        const parts = content.split(newlineRe);

        parts.forEach(token => {
          if (newlineRe.test(token)) {
            // 遇到换行符，插入一个空 content 的 enter 元素
            result.push({
              content: '',
              newNum: counter++,
              type: 'enter'
            });
          } else if (token.length > 0) {
            // 普通文本段落
            result.push({
              content: token,
              newNum: counter++,
              type: type  // 保持原来元素的 type，比如 'same'
            });
          }
          // 如果 token 既不是换行也为空串，就跳过
        });
      });

      return result;
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
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: auto;
}

:host {
  display: block;
  height: 100%;
}

.diff-page-wrapper {
  display: flex;
  flex-direction: column;
  /* 总高度可以根据需要留白，这里默认撑满剩余 */
  height: calc(100vh - 60px);
  /* 减去顶部开关的高度和 margin */
}

/* 新旧版本对比区：60% 视口高度 */
.diff-page {
  display: flex;
  gap: 20px;
  flex: 6;
  /* 60% */
  overflow: hidden;
  /* 由子元素滚动 */
  font-family: monospace;
}

.diff-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  overflow-y: auto;
  /* 各自独立滚动 */
}

.header {
  padding: 10px;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  font-weight: bold;
}

.line {
  display: inline;
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

/* 旧版本批准查看框：30% 视口高度 */
.comparison-result {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: #fefefe;

  height: 30vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 比较内容区内边距 */
.comparison-body {
  padding: 10px;
  flex: 1;
  overflow-y: auto;
}

/* 以下为批注显示样式（不变） */
.container {
  display: flex;
  margin: 0 auto;
}

.article-content {
  flex: 2;
  padding: 20px;
  line-height: 1.6;
  border-right: 1px solid #ccc;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
}

.comparison-result {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: #fefefe;
  /* height: 30vh; */
  display: flex;
  flex-direction: column;
}

.annotations-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
}

.highlight {
  background-color: #ffeb3b;
  cursor: pointer;
}

.annotation-item {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
}
.temp-highlight {
  background-color: #90ee90 !important;
}

</style>