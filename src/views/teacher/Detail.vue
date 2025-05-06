<template>
  <div class="container">
    <button @click="changeCommitModel">加载数据</button>
    <!-- 文章内容区域 -->
    <div class="diff-page-wrapper">
      <div class="diff-page">
        <!-- 旧版本 -->
        <div class="diff-column">
          <div class="header">旧版本</div>
          <span v-for="(line, index) in oldLines" :key="'old-' + index" class="line"
            :class="{ 'deleted': line.type === 'removed' }">
            <div v-if="line.type == 'enter'"><br /></div>
            <span v-else class="content">{{ line.content }}</span>
          </span>
        </div>

        <!-- 新版本 -->
        <div  @mouseup="handleTextSelection" class="diff-column">
          <div class="header">新版本</div>
          <span v-for="(line, index) in newLines" :key="'new-' + index" class="line"
            :class="{ 'added': line.type === 'added' }">
            <div v-if="line.type == 'enter'"><br /></div>
            <span v-else class="content">{{ line.content }}</span>
          </span>
        </div>
      </div>
    </div>
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
      <button @click="() => { CommitModel = false }">取消</button>
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

    };
  },
  mounted() {
    this.loadData();
    this.processDiff()

  },
  computed: {
    // 生成包含批注标记的内容
    annotatedContent() {
      let content = this.articleContent
      this.annotations.forEach(anno => {
        const highlight = `<span class="highlight" data-id="${anno.id}" data-occurrence="${anno.occurrence}">${anno.selectedText}</span>`
        content = this.replaceNth(content, this.escapeRegExp(anno.selectedText), highlight, anno.occurrence)
      })
      return content
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
      try {
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
      } catch (e) {
        console.log(e)
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

      // 计算 occurrence
      const allMatches = Array.from(this.articleContent.matchAll(new RegExp(this.escapeRegExp(this.selectedText), 'g')))
      // 计算选区在全文中的起始偏移
      const fullText = this.articleContent
      const preText = fullText.slice(0, fullText.indexOf(this.selectedText))
      // 实际上更严谨的方式是根据 range 去计算全局 offset，这里简化为 indexOf，
      // 如果你的全文中有多行相同文本，还可以更精确地结合行号和 offset
      const cursorGlobalIndex = fullText.indexOf(this.selectedText, allMatches[0]?.index ?? 0)
      // 找到是第几个 match
      let occurrence = 1
      for (let i = 0; i < allMatches.length; i++) {
        if (allMatches[i].index === cursorGlobalIndex) {
          occurrence = i + 1
          break
        }
      }

      const newAnnotation = {
        id: Date.now(),
        selectedText: this.selectedText,
        comment: this.commentInput,
        occurrence,     // 第几处匹配
        // 你还可以保存 startContainerPath / offset 等  
      };

      this.annotations.push(newAnnotation);
      this.clearSelection();
    },

    // 把文本的第 n 处匹配替换成 replacement
    replaceNth(content, searchPattern, replacement, n) {
      let i = 0;
      return content.replace(new RegExp(searchPattern, 'g'), match => {
        i++;
        return i === n ? replacement : match;
      });
    },

    // 转义正则特殊字符
    escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // 还原时，可根据 data-id + data-occurrence 找到正确元素
    scrollToAnnotation(annotation) {
      // 通过 occurrence 精准匹配
      const selector = `[data-id="${annotation.id}"][data-occurrence="${annotation.occurrence}"]`
      const element = this.$el.querySelector(selector)
      if (element) element.scrollIntoView({ behavior: 'smooth' })
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
      console.log(this.oldLines)
      console.log(this.newLines)
      console.log('-------------------------------------')
      this.oldLines = this.splitByNewline(this.oldLines)
      this.newLines = this.splitByNewline(this.newLines)
      console.log(this.oldLines)
      console.log(this.newLines)
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
  /* padding: 2px 10px; */
}

.diff-column .line {
  display: inline;
  /* 或者 display: inline; */
  /* 如果想控制各行之间少许间距，可加 margin-right */
  /* margin-right: 8px; */
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

.diff-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.comparison-result {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background: #fefefe;
}
</style>