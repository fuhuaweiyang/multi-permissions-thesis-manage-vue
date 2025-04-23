<template>
    <div>
        <el-button type="primary" @click="dialogVisible = true"> 发布论文选题</el-button>
        <el-dialog title="发布论文选题" :visible.sync="dialogVisible" width="600px">
            <el-form :model="form" :rules="rules" ref="knowForm">
                <el-form-item label="标题" prop="title" label-width="80px">
                    <el-input v-model="form.title" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="内容" prop="content" label-width="80px">
                    <el-input type="textarea" :rows="4" v-model="form.content" placeholder="请输入发布论文选题详细内容">
                    </el-input>
                </el-form-item>

                <el-form-item label="选择班级" prop="classes" label-width="80px">
                    <el-checkbox-group v-model="form.selectedClasses">
                        <el-checkbox v-for="cls in classOptions" :key="cls.id" :label="cls.id">
                            {{ cls.className }}
                        </el-checkbox>
                    </el-checkbox-group>
                </el-form-item>
            </el-form>

            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitForm">发 送</el-button>
            </div>
        </el-dialog>
        <el-table :data="knowData" style="width: 100%">
            <el-table-column type="expand">
                <template slot-scope="props">
                    <el-form label-position="left" inline class="demo-table-expand">
                        <el-form-item label="班级：">
                            <span>{{ props.row.className }}</span>
                        </el-form-item>
                        <el-form-item label="发布人：">
                            <span>{{ props.row.userName }}</span>
                        </el-form-item>
                        <el-form-item label="科目：">
                            <span>{{ props.row.subjectName }}</span>
                        </el-form-item>
                        <el-form-item label="主题：">
                            <span>{{ props.row.title }}</span>
                        </el-form-item>
                        <el-form-item label="知识点补充内容：">
                            <span>{{ props.row.content }}</span>
                        </el-form-item>
                        <el-form-item label="发布时间：">
                            <span>{{ props.row.createTime }}</span>
                        </el-form-item>
                    </el-form>
                </template>
            </el-table-column>
            <el-table-column label="详情内容" prop="subjectName">
            </el-table-column>
            <el-table-column label="发布时间" prop="createTime">
            </el-table-column>
            <el-table-column label="发布主题" prop="title">
            </el-table-column>
            <el-table-column label="科目" prop="subjectName">
            </el-table-column>
            <el-table-column label="班级" prop="className">
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
                <template slot-scope="scope">
                    <el-button @click="EditKnowPoint(scope.$index, scope.row)" type="success"> 编辑</el-button>
                    <el-button type="danger" @click="DeleteKnowPoint(scope.$index, scope.row)"> 删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.page"
            :page-sizes="[10, 20, 30, 40]" :page-size="page.pageSize" layout="total, sizes, prev, pager, next, jumper"
            :total="knowData.length">
        </el-pagination>
    </div>
</template>

<script>
import {  deleteKnow } from "../../../api/personal.js";
import { pclass } from "../../../api/admin/queryclass";
import Cookies from 'js-cookie'
import axios from "axios";
export default {
    name: "PersonalInfo",
    data() {
        return {
            page: {
                page: 1, //初始页
                pageSize: 10,    //    每页的数据
                userId: '',
                roleId: ''
            },
            knowData: [],
            param: {
                id: '',
            },
            dialogVisible: false, // 控制弹窗显示
            form: {
                title: '',
                content: '',
                selectedClasses: [],
                title: '',
                classId: '',
                creator: '',
            },
            classOptions: [],
            rules: {
                title: [
                    { required: true, message: '请输入标题', trigger: 'blur' }
                ],
                content: [
                    { required: true, message: '请输入内容', trigger: 'blur' }
                ],
                classes: [
                    { type: 'array', required: true, message: '请至少选择一个班级', trigger: 'change' }
                ]
            },
            param: {
                userId: '',
            },
        }
    },
    mounted() {
        this.page.userId = Cookies.get('userId')
        this.page.roleId = Cookies.get('roleId')
        this.listAllKnow(this.page)
        this.queryClass(this.page)
    },
    methods: {
        queryClass(pa) {
            pclass(pa).then(resp => {
                this.classOptions = resp.data.resultData
                console.log(this.classOptions)
            })
        },

        async submitForm() {
            try {
                const userId = Cookies.get('userId');
                const selectedClasses = this.form.selectedClasses;

                // 遍历 selectedClasses，每个 classId 调用一次请求
                for (const classId of selectedClasses) {
                    const params = {
                        ...this.form,
                        classId: classId, // 每次请求只传一个 classId
                        teacherId: userId,
                        teacherName: localStorage.getItem('userName'),
                    };
                    console.log(params)
                    axios.post('http://localhost:9251/api/study/thesis/save', params).then(resp=>{
                        console.log(resp)
                        if(resp.data.code==200){
                            this.$router.push("/personalinfo")
                            this.$message({
                                message: '发布成功',
                                type: 'success'
                            });
                            this.$router.push("/personalinfo")


                        }else {
                            this.$message.error('发布失败');
                        }
                    });
                }

                // 如果所有请求都成功
                this.$message.success('全部发布成功');
                this.dialogVisible = false;
                this.listAllKnow(this.page); // 刷新列表
                this.$refs.knowForm.resetFields(); // 重置表单
            } catch (error) {
                this.$message.error('发布失败');
            }
        },

        EditKnowPoint(index, row) {
            this.$router.push({
                name: 'PDetail',
                params: {
                    data1: row
                }
            })
        },

        DeleteKnowPoint(index, row) {
            this.param.id = row.id
            deleteKnow(this.param).then(resp => {
                if (resp.data.code == 200) {
                    this.$message({
                        message: '删除成功 ',
                        type: 'success'
                    });
                    this.listAllKnow(this.page)
                } else {
                    this.$message.error('删除失败');
                }
            })
        },
        listAllKnow(page) {
            axios.post('http://localhost:9251/api/study/thesis/list', page).then(resp => {
                this.knowData = resp.data.resultData.data
            })
        },
        handleSizeChange(size) {
            this.page.pageSize = size;
            // console.log(this.pageSize,'888')

            console.log(`每页 ${size} 条`);
        },
        handleCurrentChange(pageNum) {
            this.page.pageNum = pageNum;
            // this.listAllStudentsScore(this.page)
            console.log(`当前页: ${pageNum}`);
        },

    }
}
</script>

<style scoped>
.demo-table-expand {
    font-size: 0;
}

.demo-table-expand label {
    width: 90px;
    color: #99a9bf;
}

.demo-table-expand .el-form-item {
    margin-right: 0;
    margin-bottom: 0;
    width: 50%;
}
</style>
