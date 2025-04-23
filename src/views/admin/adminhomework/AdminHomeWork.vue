<template>
    <!-- 论文题目选择页面 -->
    <div style="padding: 20px;">
        <el-table :data="paginatedTheses" style="width: 100%;">
            <el-table-column prop="title" label="论文标题" />
            <el-table-column prop="content" label="论文要求" width="100" />
            <el-table-column prop="teacherName" label="创建人" width="120" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="120">
                <template #default="scope">
                    <el-button size="mini" type="primary" @click="confirmApplyThesis(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div style="text-align: right; margin-top: 20px;">
            <el-pagination background layout="prev, pager, next" :total="thesisList.length" :page-size="pageSize"
                :current-page="currentPage" @current-change="handlePageChange" />
        </div>
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
            fileList: [],
            thesisList: [], // 全部论文数据
            currentPage: 1,
            pageSize: 5,
        };
    },
    computed: {
        paginatedTheses() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = this.currentPage * this.pageSize;
            return this.thesisList.slice(start, end);
        }
    },
    created() {
        this.loadThesisList();
    },
    methods: {
        // 提交论文申请
        async confirmApplyThesis(thesis) {
            console.log(thesis)
            try {
                await this.$confirm(
                    `确定要删除题目「${thesis.title}」吗？`,
                    '确认删除',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );

                // 发送申请请求
                const res = await axios.post('http://localhost:9251/api/study/thesis/apply/' + thesis.id + "/" + jsCookie.get('userId'));
                console.log(res);
                if (res.data.code == 200) {
                    this.$message.success('删除成功');
                    // 可选：刷新列表或禁用该题目
                } else {
                    this.$message.error(res.data.message || '删除失败');
                }

            } catch (err) {
                if (err !== 'cancel') {
                    this.$message.error('删除已取消或发生错误');
                }
            }
        },

        goOthers() {
            // 你的返回逻辑
            this.$message.info("返回上一页");
        },

        handlePageChange(page) {
            this.currentPage = page;
        },

        async loadThesisList() {
            try {
                const res = await axios.get('http://localhost:9251/api/study/thesis/list'); // 假设这是获取论文的接口
                console.log(res);
                this.thesisList = res.data.resultData.data || [];
                console.log(res);
            } catch (e) {
                this.$message.error('加载论文题目失败');
            }
        },

        selectThesis(thesis) {
            this.$message.success(`已选择题目：${thesis.title}`);
            // 设置题目内容到编辑区（可选）
            this.homeworkData.title = thesis.title;
            this.homeworkData.content = thesis.content;
            this.ifHaveThesis = false;
        },

        handleFileChange(file, fileList) {
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
                this.homeworkData = { title: '', content: '' };
                this.fileList = [];
                this.$refs.uploadRef.clearFiles();
            } catch (error) {
                this.$message.error('提交失败');
                console.error('上传错误:', error);
            }
        }
    }
};
</script>
  
<style scoped>
.thesis-selection {
    max-width: 800px;
    margin: 20px auto;
}

.thesis-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.thesis-title {
    font-size: 16px;
    font-weight: 500;
}

.thesis-meta {
    display: flex;
    gap: 15px;
    align-items: center;
    color: #666;
    font-size: 12px;
}

.empty-tip {
    text-align: center;
    color: #999;
    padding: 20px;
}
</style>