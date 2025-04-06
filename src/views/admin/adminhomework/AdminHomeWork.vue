<template>
    <div>
        <el-table :data="TeacherData" :default-sort="{ prop: 'date', order: 'descending' }" style="width: 100%">
            <el-table-column sortable fixed prop="title" label="论文标题">
            </el-table-column>
            <el-table-column prop="userName" label="发布教师" width="180">
            </el-table-column>
            <el-table-column prop="className" label="班级" width="100">
            </el-table-column>
            <el-table-column prop="subjectName" label="科目">
            </el-table-column>
            <el-table-column prop="createTime" label="发布时间">
            </el-table-column>

            <el-table-column label="操作" width="260" fixed="right">
                <template slot-scope="scope">
                    <el-button type="primary" @click="handleEdit(scope.$index, scope.row)"> 查看</el-button>
                    <el-button type="danger" @click="handleDelete(scope.$index, scope.row)"> 删除</el-button>
                    <el-button @click="uploadFile()">上传文件</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.pageNum"
            :page-sizes="[10, 20, 30, 40]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="TeacherData.length">
        </el-pagination>
        <!-- <el-upload class="upload-demo" drag action="http://localhost:9251/api/docs/upload" multiple>
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
                Drop file here or <em>click to upload</em>
            </div>
            <template #tip>
                <div class="el-upload__tip">
                    doc files with a size less than 500kb
                </div>
            </template>
        </el-upload> -->
    </div>
</template>

<script>
import { ahomework, deleteHomewor } from "../../../api/admin/adminhomework.js";

export default {
    name: "AdminHomeWork",
    data() {
        return {
            TeacherData: [],
            page: {
                page: 1, //初始页
                pageSize: 10, //    每页的数据

            },
            param: {
                id: '',
            }
        }
    },

    created() {
        this.work(this.page)
    },
    methods: {
        handleEdit(index, row) {
            this.$router.push({
                name: 'HomeworkDetail',
                params: {
                    data1: row.content
                }
            })
        },
        handleDelete(index, row) {
            this.param.id = row.id;
            deleteHomewor(this.param).then(resp => {
                if (resp.data.code == 200) {
                    this.$message({
                        message: '删除成功 ',
                        type: 'success'
                    });
                    this.work(this.page)
                } else {
                    this.$message.error('删除失败');
                }
            })
        },
        handleSizeChange(size) {
            this.page.pageSize = size;
            this.work(this.page)
            // console.log(this.pageSize,'888')
            console.log(`每页 ${size} 条`);
        },
        handleCurrentChange(pageNum) {
            this.page.pageNum = pageNum;
            this.work(this.page)
            console.log(`当前页: ${pageNum}`);
        },

        work(page) {
            ahomework(page).then(resp => {
                this.TeacherData = resp.data.resultData.data
                console.log(resp, '123')
                // state.ClassData=resp.data.data.records
                // this.$store.dispatch('classAction',this.ClassData)
            })
        },
        async uploadFile() {
            // 获取文件输入元素（需在模板中设置 ref="fileInput"）
            const fileInput = this.$refs.fileInput;
            const file = fileInput.files[0];

            if (!file) {
                this.$message.error('请先选择文件！');
                return;
            }

            // 验证文件类型和大小（示例）
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                this.$message.error('文件大小超过限制！');
                return;
            }
            if (!file.type.startsWith('image/')) { // 按需调整类型
                this.$message.error('仅支持图片文件！');
                return;
            }

            // 构建 FormData
            const formData = new FormData();
            formData.append('file', file); // 字段名需与后端一致

            try {
                // 发送请求（假设已封装上传接口，需自行替换为实际接口）
                const response = await this.$http.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // 根据后端返回结构处理响应
                if (response.data.code === 200) {
                    this.$message.success('上传成功');
                    this.work(this.page); // 刷新列表数据
                } else {
                    this.$message.error(response.data.message || '上传失败');
                }
            } catch (error) {
                this.$message.error('上传请求失败');
                console.error('上传错误:', error);
            }
        },

    },
}
</script>

<style scoped></style>