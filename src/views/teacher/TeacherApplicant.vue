<template>
    <div>
        <el-table :data="tableData" :default-sort="{ prop: 'date', order: 'descending' }" style="width: 100%">
            <el-table-column prop="user_name" label="姓名" width="180">
            </el-table-column>
            <el-table-column prop="sex" label="性别" width="180">
            </el-table-column>
            <el-table-column prop="phone" label="学生电话">
            </el-table-column>
            <el-table-column prop="thesis_title" label="论文题目">
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
                <template slot-scope="scope">
                    <el-button type="success" @click="handleEdit(scope.$index, scope.row, 1)"> 同意
                    </el-button>
                    <el-button type="danger" @click="handleDelete(scope.$index, scope.row, -1)"> 驳回
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.page"
            :page-sizes="[10, 20, 30, 40]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="tableData.length">
        </el-pagination>
    </div>
</template>

<script>
import { tapplicant, alertapplicant } from "../../api/teacher/teacherapplicant.js";
import Cookies from 'js-cookie'
import axios from "axios";
import jsCookie from "js-cookie";
export default {
    name: "TeacherApplicant",
    data() {
        return {
            tableData: [],
            page: {
                page: 1, //初始页
                pageSize: 10,    //    每页的数据
                userId: '',
            },

            alertData: {},
            flag: true
        }
    },
    created() {
        this.page.userId = Cookies.get('userId')
        this.loadData()

        if (this.tableData.status == '待审核') {
            this.flag = false
        }
    },
    methods: {
        loadData() {
            axios.get('http://localhost:9251/api/study/thesis/getApplyRequestById/' + jsCookie.get('userId')).then(resp => {
                console.log(resp.data.resultData)
                this.tableData = resp.data.resultData
            })
        },
        handleDetail(row) {
            this.$router.push({
                path: '/studentweb/studentmanagement/studentdetail',
                query: {
                    userId: row.userId
                }
            })
        },

        handleEdit(index, row, status) {
            this.alertData = row
            this.alertData.status = status
            console.log(row)
            axios.post('http://localhost:9251/api/study/thesis/confirmThesisRequest/', {
                studentId: row.student_id,
                thesisId: row.thesis_id,
                status: status
            }).then(resp => {
                if (resp.data.code == 200) {
                    this.$message({
                        message: '您已进行审批',
                        type: 'success'
                    });
                    if (status == 1) {
                        try {
                            axios.post('http://localhost:9251/api/docs/saveOriginDoc', {
                                title: '11',
                                stuId: row.student_id,
                            }).then(response => {
                                this.$message.success('提交成功');
                            });
                        } catch (error) {
                            this.$message.error('提交失败');
                            console.error('上传错误:', error);
                        }
                    }
                    this.loadData()
                } else {
                    this.$message.error('审批失败');
                }
            })

        },
        handleAdd(index, row, status) {
            this.handleEdit(index, row, status)
        },

        handleDelete(index, row, status) {
            this.handleEdit(index, row, status)

        },

        handleSizeChange(size) {
            this.page.pageSize = size;
            // console.log(this.pageSize,'888')
            this.listUnApplicant(this.page)
            console.log(`每页 ${size} 条`);
        },
        handleCurrentChange(pageNum) {
            this.page.pageNum = pageNum;
            this.listUnApplicant(this.page)
            console.log(`当前页: ${val}`);
        },

        listUnApplicant(page) {
            tapplicant(page).then(resp => {
                this.tableData = resp.data.resultData.data
                console.log(this.tableData)
            })
        },
    }
}
</script>

<style scoped></style>