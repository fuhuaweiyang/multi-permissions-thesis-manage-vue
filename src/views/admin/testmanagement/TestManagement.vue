<template>
    <div>
        <el-table :data="TestData" :default-sort="{ prop: 'date', order: 'descending' }" style="width: 100%">
            <el-table-column sortable fixed prop="createTime" label="创建时间" width="180">
            </el-table-column>
            <el-table-column prop="userName" label="发布教师" width="180">
            </el-table-column>
            <el-table-column prop="title" label="试题标题" width="100">
            </el-table-column>
            <el-table-column prop="className" label="班级">
            </el-table-column>
            <el-table-column prop="subjectName" label="科目">
            </el-table-column>

            <el-table-column label="操作" width="260" fixed="right">
                <template slot-scope="scope">
                    <el-button @click="handleEdit(scope.$index, scope.row)"  type="primary"> 详情</el-button>
                    <el-button @click="handleDelete(scope.$index, scope.row)"  type="danger"> 删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.pageNum"
            :page-sizes="[10, 20, 30, 40]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="TestData.length">
        </el-pagination>
    </div>
</template>

<script>
import { testpoint, deleteTest } from "../../../api/admin/test.js";

export default {
    name: "TestManagement",
    data() {
        return {
            TestData: [],
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
        this.Testknow(this.page)
    },
    methods: {
        handleEdit(index, row) {
            this.$router.push({
                name: 'TestHomeWork',
                params: {
                    data1: row.content
                }

            })
        },
        handleDelete(index, row) {
            this.param.id = row.id;
            deleteTest(this.param).then(resp => {
                if (resp.data.code == 200) {
                    this.$message({
                        message: '删除成功 ',
                        type: 'success'
                    });
                    this.Testknow(this.page)
                } else {
                    this.$message.error('删除失败');
                }
            })
        },
        handleSizeChange(size) {
            this.page.pageSize = size;
            this.Testknow(this.page)
            // console.log(this.pageSize,'888')
            console.log(`每页 ${size} 条`);
        },
        handleCurrentChange(pageNum) {
            this.page.pageNum = pageNum;
            this.Testknow(this.page)
            console.log(`当前页: ${pageNum}`);
        },

        Testknow(page) {
            testpoint(page).then(resp => {
                this.TestData = resp.data.resultData.data
                console.log(resp, '123')
                // state.ClassData=resp.data.data.records
                // this.$store.dispatch('classAction',this.ClassData)
            })
        }
    },
}
</script>

<style scoped></style>