<template>
    <div>
        <!-- 修改后的广播按钮 -->
        <el-button type="primary" plain @click="handleBroadcast">向全班广播消息</el-button>

        <!-- 新增广播弹窗 -->
        <el-dialog title="班级广播" :visible.sync="dialogBroadcastVisible" width="30%">
            <el-form :model="broadcastForm" label-width="80px">
                <el-form-item label="标题">
                    <el-input v-model="broadcastForm.title" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="内容">
                    <el-input type="textarea" :rows="4" v-model="broadcastForm.content" placeholder="请输入广播内容">
                    </el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogBroadcastVisible = false">取 消</el-button>
                <el-button type="primary" @click="sendBroadcast">确 定</el-button>
            </span>
        </el-dialog>

        <!-- 原有表格 -->
        <el-table :data="tableData" :default-sort="{ prop: 'date', order: 'descending' }" style="width: 100%">
            <el-table-column sortable prop="account" label="账号" width="180"></el-table-column>
            <el-table-column prop="userName" label="姓名" width="180"></el-table-column>
            <el-table-column prop="phone" label="学生电话"></el-table-column>
            <el-table-column prop="sexName" label="性别"></el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
                <template slot-scope="scope">
                    <el-button type="primary" @click="handleViewProgress(scope.row)">查看论文进度</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.page"
            :page-sizes="[10, 20, 30, 40]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="tableData.length">
        </el-pagination>

        <!-- 历史记录弹窗 -->
        <el-dialog title="论文修改历史" :visible.sync="dialogVisible" width="60%">
            <el-table :data="historyRecords" @row-click="handleHistoryClick" style="cursor: pointer">
                <el-table-column prop="modificationTime" label="修改时间" width="180"></el-table-column>
                <el-table-column prop="docId" label="论文Id"></el-table-column>
                <el-table-column prop="docId" label="论文Id"></el-table-column>
                <el-table-column prop="modificationWhat" label="修改标题" width="120"></el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script>
import { tclassmanagemt, deleteStudent } from "../../api/teacher/teacherclass.js";

import Cookies from 'js-cookie'
import axios from "axios";

export default {
    name: "StudentInfo",

    data() {
        return {
            // 新增广播相关数据
            dialogBroadcastVisible: false,
            broadcastForm: {
                title: '',
                content: '',
                classId: '',
                creator: ''
            },

            // 原有数据
            tableData: [],
            dialogVisible: false,
            pagination: {
                page: 1,
                total: 0
            },
            historyRecords: [],
            page: {
                page: 1,
                pageSize: 10,
                userId: ''
            },
            form: {
                userName: '',
                account: '',
                phone: '',
                className: '',
            },
            formLabelWidth: '120px',
            param: {
                userId: '',
            },
            classIdList: []
        }
    },

    mounted() {
        this.page.userId = Cookies.get('userId')
        this.listAllClass(this.page)
        axios.post("http://localhost:9251/study/class/findListByUserId/"+Cookies.get('userId')).then(response => {
            this.classIdList = response.data.resultData
        })
    },

    methods: {
        // 新增广播方法
        async handleBroadcast() {
            this.dialogBroadcastVisible = true;
            this.broadcastForm = { title: '', content: '' };
        },

        async sendBroadcast() {
            if (!this.broadcastForm.title.trim() || !this.broadcastForm.content.trim()) {
                this.$message.warning('标题和内容不能为空');
                return;
            }
            console.log('begin')
            this.broadcastForm.classId = this.classIdList[0]
            console.log(this.broadcastForm)
            try {

                const response = await axios.post(
                    'http://localhost:9251/save/knowledgePoint/save',
                    this.broadcastForm,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        withCredentials: true // 允许发送凭证
                    }
                )
                console.log(response)
                // if (response.data.code === 200) {
                //     this.$message.success('广播发送成功');
                //     this.dialogBroadcastVisible = false;
                // } else {
                //     this.$message.error('发送失败: ' + (response.data.message || ''));
                // }
            } catch (error) {
                console.error('发送失败:', error);
                this.$message.error('广播发送失败');
            }
        },

        // 原有方法保持不变
        async handleViewProgress(row) {
            this.dialogVisible = true;
            try {
                const response = await axios.post(
                    'http://localhost:9251/api/modification/getModification',
                    { stuId: row.userId, page: 1, pageSize: 10 },
                    { headers: { 'Content-Type': 'application/json' } }
                );
                this.historyRecords = response.data || [];
                console.log(this.historyRecords);
            } catch (error) {
                console.error('请求异常:', error);
                this.$message.error('数据加载失败');
            }
        },

        handleHistoryClick(record) {
            console.log('点击了记录：', record);
            localStorage.setItem('docModificationrecord', JSON.stringify(record));
            localStorage.setItem('docId', record.docId);
            localStorage.setItem('modificationId', record.id);
            this.$router.push({ name: 'Detail', query: { type: "试题" } });
        },

        handleDelete(index, row) {
            this.param.userId = row.userId
            deleteStudent(this.param).then(resp => {
                if (resp.data.code == 200) {
                    this.$message.success('移除学生成功');
                    this.listAllClass(this.page)
                } else {
                    this.$message.error('移除学生失败');
                }
            })
        },

        handleSizeChange(size) {
            this.page.pageSize = size;
            this.listAllClass(this.page)
        },

        handleCurrentChange(pageNum) {
            this.page.page = pageNum;
            this.listAllClass(this.page)
        },

        listAllClass(page) {
            tclassmanagemt(page).then(resp => {
                this.tableData = resp.data.resultData.data
            })
        }
    }
}
</script>

<style>
.el-table--enable-row-hover .el-table__body tr:hover>td {
    background-color: #f5f7fa;
}

/* 其他样式保持不变 */
</style>