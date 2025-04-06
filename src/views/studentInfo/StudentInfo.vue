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
                <el-table-column prop="date" label="修改时间" width="180">
                </el-table-column>
                <el-table-column prop="version" label="版本号" width="120">
                </el-table-column>
                <el-table-column prop="status" label="当前状态">
                </el-table-column>
                <el-table-column prop="reviewer" label="审核人">
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script>
import { tclassmanagemt, deleteStudent } from "../../api/teacher/teacherclass.js";
import { mapState } from 'vuex'
import Cookies from 'js-cookie'

export default {
    name: "StudentInfo",

    data() {
        return {
            // 原有数据保持不变
            tableData: [],
            dialogVisible: false,
            historyRecords: [ // 示例数据
                {
                    date: '2023-07-20',
                    version: 'v2.1',
                    status: '已通过',
                    reviewer: '王教授',
                    paperId: '123'
                },
                {
                    date: '2023-07-18',
                    version: 'v2.0',
                    status: '需修改',
                    reviewer: '李教授',
                    paperId: '123'
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
        handleViewProgress(row) {
            this.dialogVisible = true;
            // 这里应该调用接口获取该学生的论文修改历史
            // 示例：
            // getPaperHistory(row.userId).then(res => {
            //     this.historyRecords = res.data;
            // })
        },

        handleHistoryClick(record) {
            // 跳转到论文详情页，假设路由为/paper-detail/:id
            this.$router.push({
                path: `/paper-detail/${record.paperId}`,
                query: { version: record.version }
            });
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