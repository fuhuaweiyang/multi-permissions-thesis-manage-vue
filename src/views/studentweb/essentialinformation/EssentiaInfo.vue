<template>
    <div>
    <el-descriptions class="margin-top" title="用户信息" :column="3" :size="size" border>
        <template slot="extra">
            <el-button type="primary" size="small" @click="alertpersonal()"> 编辑</el-button>
        </template>
        <el-descriptions-item>
            <template slot="label">
                <i class="el-icon-user"></i>
                用户名
            </template>
            {{Info.userName}}
        </el-descriptions-item>
        <el-descriptions-item>
            <template slot="label">
                <i class="el-icon-mobile-phone"></i>
                手机号
            </template>
            {{Info.phone}}
        </el-descriptions-item>
        <el-descriptions-item v-if="Info.sex==0">
            <template slot="label">
                <i class="el-icon-tickets"></i>
                性别
            </template>
            <el-tag size="small">男</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="Info.sex==1">
            <template slot="label">
                <i class="el-icon-tickets"></i>
                性别
            </template>
            <el-tag size="small">女</el-tag>
        </el-descriptions-item>
        <el-descriptions-item>
            <template slot="label">
                <i class="el-icon-office-building"></i>
                创建时间
            </template>
            {{Info.createTime}}
        </el-descriptions-item>
    </el-descriptions>

        <el-dialog title="修改个人信息" :visible.sync="dialogFormVisible">
            <el-form :model="Info" :rules="rules">
                <el-form-item label="姓名" :label-width="formLabelWidth" prop="userName">
                    <el-input v-model="Info.userName" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="账号" :label-width="formLabelWidth" prop="userName">
                    <el-input v-model="Info.account" autocomplete="off" disabled></el-input>
                </el-form-item>
                <!--                <el-form-item label="账号" :label-width="formLabelWidth" prop="account">-->
                <!--                    <el-input v-model="Info.account" autocomplete="off"></el-input>-->
                <!--                </el-form-item>-->
                <el-form-item label="电话" :label-width="formLabelWidth" prop="phone">
                    <el-input v-model="Info.phone" autocomplete="off"></el-input>
                </el-form-item>
                <!-- <el-form-item label="入校时间" :label-width="formLabelWidth" prop="phone">
                    <el-input v-model="Info.createTime" autocomplete="off"></el-input>
                </el-form-item> -->

            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible = false"> 取 消</el-button>
                <el-button type="primary" @click="submit(Info)"> 确 定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    import {personal} from '../../../api/personal.js'
    import Cookies from 'js-cookie'
    import {listAllClass} from "../../../api/alertpersonal";
    export default {
        name: "EssentiaInfo",
        data(){
            return{
                dialogFormVisible:false,
                Info:[],
                userId:{
                    id:'',
                }
            }
        },
        created() {
            this.userId.id=Cookies.get("userId")
            this.listPersonal(this.userId)
        },
        methods:{
            listPersonal(userId){
                personal(userId).then(resp=>{
                    this.Info=resp.data.resultData
                })
            },
            alertpersonal(){
                this.dialogFormVisible=true
            },
            submit(da){
                listAllClass(da).then(resp=>{
                    if(resp.data.code==200){
                        this.$message({
                            message: '编辑成功 ',
                            type: 'success'
                        });
                        this.dialogFormVisible=false
                        this.studentquery(this.page)
                    }else{
                        this.$message.error('删除失败');
                    }
                })
            },
        }
    }
</script>

<style scoped>

</style>