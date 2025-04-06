<template>
    <div class="diff-page">
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
            newLines: []
        }
    },
    mounted() {
        this.loadData()
        this.processDiff()

    },
    methods: {
        async loadData() {
            try {
                
                const response = await axios.get(
                    'http://localhost:9251/api/modification/getDocByModificationId/6/10',
                );
                console.log(response);
                this.patchText = response.data.modification
                const response2 = await axios.get(
                    'http://localhost:9251/api/docs/6',
                );
                this.oldText = response2.data.txt
                console.log(response2);
                console.log('原始补丁:', this.patchText)
                console.log('原始文本', this.oldText)
                const patches = this.dmp.patch_fromText(this.patchText)

                // 应用补丁并验证结果
                const [newText, results] = this.dmp.patch_apply(patches, this.oldText)
                if (results.some(success => !success)) {
                    throw new Error('部分补丁应用失败')
                }

                console.log('应用补丁后的新文本:', newText)

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
                console.log('安全通过类型检查', diff[0])

                const type = diff[0]
                const content = diff[1]


                console.log('处理差异:', content)
                console.log('this.dmp.DIFF_DELETE:', this.dmp.DIFF_DELETE)
                console.log('this.dmp.DIFF_INSERT:', this.dmp.DIFF_INSERT)
                console.log('this.dmp.DIFF_EQUAL:', this.dmp.DIFF_EQUAL)
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
        }
    }
}
</script>
  
<style scoped>
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
</style>