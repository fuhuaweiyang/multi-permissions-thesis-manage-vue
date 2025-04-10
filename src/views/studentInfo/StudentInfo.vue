<template>
    <div>
        <el-table :data="tableData" :default-sort="{ prop: 'date', order: 'descending' }" style="width: 100%">
            <!-- 原有列保持不变 -->
            <el-table-column sortable prop="account" label="账号" width="180">
            </el-table-column>
            <el-table-column prop="userName" label="姓名" width="180">
            </el-table-column>
            <el-table-column prop="phone" label="学生电话">
            </el-table-column>
            <el-table-column prop="sexName" label="性别">
            </el-table-column>

            <el-table-column label="操作" width="260" fixed="right">
                <template slot-scope="scope">
                    <el-button type="primary" @click="handleViewProgress(scope.row)"> 查看论文进度
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件保持不变 -->
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.page"
            :page-sizes="[10, 20, 30, 40]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="tableData.length">
        </el-pagination>

        <!-- 历史记录弹窗 -->
        <el-dialog title="论文修改历史" :visible.sync="dialogVisible" width="60%">
            <el-table :data="historyRecords" @row-click="handleHistoryClick" style="cursor: pointer">
                <el-table-column prop="modificationTime" label="修改时间" width="180">
                </el-table-column>
                <el-table-column prop="docId" label="论文Id">
                </el-table-column>
                <el-table-column prop="modificationWhat" label="修改标题" width="120">
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script>
import { tclassmanagemt, deleteStudent } from "../../api/teacher/teacherclass.js";
import { mapState } from 'vuex'
import Cookies from 'js-cookie'
import axios from "axios";

export default {
    name: "StudentInfo",

    data() {
        return {
            // 原有数据保持不变
            tableData: [],
            dialogVisible: false,
            pagination: {         // 分页对象
                page: 1,
                total: 0
            },
            historyRecords: [ // 示例数据
            {
                modificationTime: '',
                docId: '',
                modificationWhat: '',
            }
            ],
            // 其他原有数据...
            tableData: [],
            page: {
                page: 1, //初始页
                pageSize: 10,    //    每页的数据
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
            }
        }
    },
    created() {
        this.page.userId = Cookies.get('userId')
        this.listAllClass(this.page)
    },
    methods: {
        async handleViewProgress(row) {
            this.dialogVisible = true;

            console.log(row)
            try {
                const response = await axios.post(
                    'http://localhost:9251/api/modification/getModification',
                    {
                        stuId: row.userId,  //row.userid
                        page: 1,
                        pageSize: 10
                    },
                    {
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                console.log(response);
                this.historyRecords = response.data || [];
            //     historyRecords: [ // 示例数据
            //     {
            //         date: '2023-07-20',
            //         version: 'v2.1',
            //         status: '已通过',
            //         reviewer: '王教授',
            //         paperId: '123'
            //     },
            //     {
            //         date: '2023-07-18',
            //         version: 'v2.0',
            //         status: '需修改',
            //         reviewer: '李教授',
            //         paperId: '123'
            //     }
            // ],
                // this.pagination.total = response.data.data.total || 0;
            } catch (error) {
                console.error('请求异常:', error);
                this.$message.error('数据加载失败');
            }
        },

        handleHistoryClick(record) {
            // 跳转到论文详情页
            console.log('点击了记录：', record);
            localStorage.setItem('docModificationrecord', JSON.stringify(record));
            localStorage.setItem('docId', record.docId);
            const savedRecord = JSON.parse(localStorage.getItem('docModificationrecord'));
            this.$router.push({
                name: 'Detail',
                query: {
                    type: "试题"
                },
                data1: 'test'
            })
        },
        handleDelete(index, row) {
            this.param.userId = row.userId
            deleteStudent(this.param).then(resp => {
                if (resp.data.code == 200) {
                    this.$message({
                        message: '移除学生成功 ',
                        type: 'success'
                    });
                    this.dialogFormVisibleEdit = true
                    this.listAllClass(this.page)
                } else {
                    this.$message.error('移除学生失败');
                }
            })
        },
        handleSizeChange(size) {
            this.page.pageSize = size;
            // console.log(this.pageSize,'888')
            this.listAllClass(this.page)
            console.log(`每页 ${size} 条`);
        },
        handleCurrentChange(pageNum) {
            this.page.pageNum = pageNum;
            this.listAllClass(this.page)
            console.log(`当前页: ${val}`);
        },

        listAllClass(page) {
            tclassmanagemt(page).then(resp => {
                this.tableData = resp.data.resultData.data
                console.log(this.tableData)
            })
        },
        // 其他原有方法保持不变...
    },
    // 其他原有代码...
}
</script>

<style>
/* 新增样式 */
.el-table--enable-row-hover .el-table__body tr:hover>td {
    background-color: #f5f7fa;
}

/* 原有样式保持不变 */
</style>